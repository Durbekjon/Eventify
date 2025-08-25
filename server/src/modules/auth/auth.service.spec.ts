import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { AuthRepository } from './auth.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UtilsService } from '@core/utils/utils.service'
import { JwtService } from '@nestjs/jwt'
import { EmailService } from '@core/email/email.service'
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common'
import { HTTP_MESSAGES } from '@consts/http-messages'

describe('AuthService', () => {
  let service: AuthService
  let prismaService: any // Using any for easier mocking
  let utilsService: jest.Mocked<UtilsService>
  let jwtService: jest.Mocked<JwtService>
  let emailService: jest.Mocked<EmailService>
  let authRepository: jest.Mocked<AuthRepository>

  // Mock data for tests
  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'hashedPassword123',
    isAdmin: false,
    selectedRole: null,
    customerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarId: null,
    status: 'ACTIVE' as any,
    roles: [],
  }

  const mockUserWithoutPassword = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    isAdmin: false,
    selectedRole: null,
    customerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarId: null,
    status: 'ACTIVE' as any,
    roles: [],
  }

  const mockVerificationCode = {
    id: 'verification-123',
    email: 'test@example.com',
    otp: '123456',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword123',
    createdAt: new Date(),
  }

  const mockRestoreCode = {
    email: 'test@example.com',
    otp: '123456',
    createdAt: new Date(),
  }

  beforeEach(async () => {
    // Create comprehensive mocks for all dependencies
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      verificationCodes: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      restoreCodes: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any // Type assertion for cleaner mocking

    const mockUtilsService = {
      compareHash: jest.fn(),
      generateBcrypt: jest.fn(),
      generateOtp: jest.fn(),
      isOtpExpired: jest.fn(),
    }

    const mockJwtService = {
      sign: jest.fn(),
      decode: jest.fn(),
      verify: jest.fn(),
    }

    const mockEmailService = {
      sendRegistrationOtp: jest.fn(),
      sendRestoreAccountOtp: jest.fn(),
    }

    const mockAuthRepository = {
      getUserByEmail: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UtilsService, useValue: mockUtilsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuthRepository, useValue: mockAuthRepository },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    prismaService = module.get(PrismaService)
    utilsService = module.get(UtilsService)
    jwtService = module.get(JwtService)
    emailService = module.get(EmailService)
    authRepository = module.get(AuthRepository)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('login', () => {
    const loginDto = {
      email: 'Test@Example.com', // Note: Mixed case to test toLowerCase
      password: 'password123',
    }

    it('should successfully login with valid credentials', async () => {
      // Arrange - Create fresh copy to avoid mutation
      const freshMockUser = { ...mockUser }
      prismaService.user.findUnique.mockResolvedValue(freshMockUser)
      utilsService.compareHash.mockResolvedValue(true)
      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      // Act
      const result = await service.login(loginDto)

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }, // Should be lowercase
        include: { roles: true },
      })
      expect(utilsService.compareHash).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123',
      )
      expect(result.user).toEqual(mockUserWithoutPassword)
      expect(result.token).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
      })
      expect(result.user.password).toBeUndefined()
    })

    it('should throw BadRequestException when user not found', async () => {
      // Arrange
      prismaService.user.findUnique.mockResolvedValue(null)

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException)
      await expect(service.login(loginDto)).rejects.toThrow(
        HTTP_MESSAGES.USER.NOT_FOUND,
      )

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { roles: true },
      })
    })

    it('should throw BadRequestException when password is incorrect', async () => {
      // Arrange - Create fresh copy to avoid mutation
      const freshMockUser = { ...mockUser }
      prismaService.user.findUnique.mockResolvedValue(freshMockUser)
      utilsService.compareHash.mockResolvedValue(false)

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException)
      await expect(service.login(loginDto)).rejects.toThrow(
        HTTP_MESSAGES.AUTH.WRONG_PASSWORD,
      )

      expect(utilsService.compareHash).toHaveBeenCalledWith(
        'password123',
        'hashedPassword123',
      )
    })

    it('should remove password from user object in response', async () => {
      // Arrange - Create fresh copy to avoid mutation
      const freshMockUser = { ...mockUser }
      prismaService.user.findUnique.mockResolvedValue(freshMockUser)
      utilsService.compareHash.mockResolvedValue(true)
      jwtService.sign.mockReturnValue('mock-token')

      // Act
      const result = await service.login(loginDto)

      // Assert
      expect(result.user).not.toHaveProperty('password')
      expect(result.user).toEqual(mockUserWithoutPassword)
    })

    it('should convert email to lowercase before database query', async () => {
      // Arrange - Create fresh copy to avoid mutation
      const mixedCaseLoginDto = {
        email: 'Test@Example.COM', // Mixed case email
        password: 'password123',
      }
      const freshMockUser = { ...mockUser }
      prismaService.user.findUnique.mockResolvedValue(freshMockUser)
      utilsService.compareHash.mockResolvedValue(true)
      jwtService.sign.mockReturnValue('mock-token')

      // Act
      await service.login(mixedCaseLoginDto)

      // Assert
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }, // Should be converted to lowercase
        include: { roles: true },
      })
    })
  })

  describe('registration', () => {
    const registrationDto = {
      email: 'newuser@example.com',
      password: 'newpassword123',
      firstName: 'John',
      lastName: 'Doe',
    }

    it('should successfully register a new user', async () => {
      // Arrange
      authRepository.getUserByEmail.mockResolvedValue(null) // User doesn't exist
      utilsService.generateOtp.mockReturnValue('123456')
      utilsService.generateBcrypt.mockResolvedValue('hashedPassword')
      emailService.sendRegistrationOtp.mockResolvedValue(undefined)
      prismaService.verificationCodes.upsert.mockResolvedValue({
        id: 'verification-123',
        ...mockVerificationCode,
      })

      // Act
      const result = await service.registration(registrationDto)

      // Assert
      expect(authRepository.getUserByEmail).toHaveBeenCalledWith(
        'newuser@example.com',
      )
      expect(utilsService.generateOtp).toHaveBeenCalled()
      expect(emailService.sendRegistrationOtp).toHaveBeenCalledWith(
        'newuser@example.com',
        '123456',
      )
      expect(result).toEqual({ token: 'verification-123' })
    })

    it('should throw BadRequestException if user already exists', async () => {
      // Arrange
      authRepository.getUserByEmail.mockResolvedValue(mockUser)

      // Act & Assert
      await expect(service.registration(registrationDto)).rejects.toThrow(
        BadRequestException,
      )
      await expect(service.registration(registrationDto)).rejects.toThrow(
        HTTP_MESSAGES.USER.EXISTS,
      )
    })
  })

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    }

    it('should successfully refresh token with valid refresh token', async () => {
      // Arrange
      const decodedToken = {
        id: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
      } // 1 hour from now
      jwtService.decode.mockReturnValue(decodedToken)
      prismaService.user.findUnique.mockResolvedValue(mockUser)
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token')

      // Act
      const result = await service.refreshToken(refreshTokenDto)

      // Assert
      expect(jwtService.decode).toHaveBeenCalledWith('valid-refresh-token')
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      })
      expect(result.token).toEqual({
        access: 'new-access-token',
        refresh: 'new-refresh-token',
      })
    })

    it('should throw ForbiddenException when token is expired', async () => {
      // Arrange
      const expiredToken = {
        id: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600,
      } // 1 hour ago
      jwtService.decode.mockReturnValue(expiredToken)

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        ForbiddenException,
      )
    })

    it('should throw ForbiddenException when token is invalid', async () => {
      // Arrange
      jwtService.decode.mockReturnValue(null)

      // Act & Assert
      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(
        ForbiddenException,
      )
    })
  })
})
