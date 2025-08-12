import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { UserManagementService } from './user-management.service'
import { PrismaService } from '@/core/prisma/prisma.service'

describe('UserManagementService', () => {
  let service: UserManagementService
  let prismaService: PrismaService

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    log: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile()

    service = module.get<UserManagementService>(UserManagementService)
    prismaService = module.get<PrismaService>(PrismaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getUsers', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          companies: [],
          _count: {
            companies: 2,
            tasks: 10,
            logs: 50,
          },
        },
      ]

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers)
      mockPrismaService.user.count.mockResolvedValue(1)

      const result = await service.getUsers(1, 10)

      expect(result.users).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.users[0].companyCount).toBe(2)
      expect(result.users[0].taskCount).toBe(10)
      expect(result.users[0].activityCount).toBe(50)
    })
  })

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const mockUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companies: [],
        tasks: [],
        logs: [],
        transactions: [],
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getUserById('user-1')

      expect(result).toEqual(mockUser)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.getUserById('user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'john@example.com',
      }

      const updateData = {
        firstName: 'John',
        lastName: 'Smith',
      }

      const updatedUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser) // First call for existing user check
        .mockResolvedValueOnce(null) // Second call for email uniqueness check
      mockPrismaService.user.update.mockResolvedValue(updatedUser)

      const result = await service.updateUser('user-1', updateData)

      expect(result).toEqual(updatedUser)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.updateUser('user-1', { firstName: 'John' })).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when email already exists', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'john@example.com',
      }

      const updateData = {
        email: 'newemail@example.com',
      }

      const conflictingUser = {
        id: 'user-2',
        email: 'newemail@example.com',
      }

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(conflictingUser)

      await expect(service.updateUser('user-1', updateData)).rejects.toThrow(BadRequestException)
    })
  })

  describe('toggleUserBlock', () => {
    it('should block user successfully', async () => {
      const existingUser = {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const updatedUser = {
        ...existingUser,
        updatedAt: new Date(),
      }

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser)
      mockPrismaService.user.update.mockResolvedValue(updatedUser)

      const result = await service.toggleUserBlock('user-1', true)

      expect(result.action).toBe('blocked')
      expect(result.user).toEqual(updatedUser)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.toggleUserBlock('user-1', true)).rejects.toThrow(NotFoundException)
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully when no associated data', async () => {
      const user = {
        id: 'user-1',
        companies: [],
        tasks: [],
        transactions: [],
      }

      mockPrismaService.user.findUnique.mockResolvedValue(user)
      mockPrismaService.user.delete.mockResolvedValue({})

      const result = await service.deleteUser('user-1', true)

      expect(result.message).toContain('deleted successfully')
    })

    it('should throw BadRequestException when user has associated data', async () => {
      const user = {
        id: 'user-1',
        companies: [{ id: 'company-1' }],
        tasks: [],
        transactions: [],
      }

      mockPrismaService.user.findUnique.mockResolvedValue(user)

      await expect(service.deleteUser('user-1', true)).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.deleteUser('user-1', true)).rejects.toThrow(NotFoundException)
    })
  })

  describe('getUserActivity', () => {
    it('should return user activity logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          message: 'User action',
          createdAt: new Date(),
          company: {
            id: 'company-1',
            name: 'Test Company',
          },
        },
      ]

      mockPrismaService.log.findMany.mockResolvedValue(mockLogs)
      mockPrismaService.log.count.mockResolvedValue(1)

      const result = await service.getUserActivity('user-1', 1, 20)

      expect(result.logs).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('getUserStatistics', () => {
    it('should return user statistics', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isAdmin: false,
        _count: {
          companies: 2,
          tasks: 10,
          logs: 50,
          transactions: 5,
          files: 3,
        },
        transactions: [
          { amount: 1000, createdAt: new Date() },
          { amount: 2000, createdAt: new Date() },
        ],
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.getUserStatistics('user-1')

      expect(result.userId).toBe('user-1')
      expect(result.statistics.companies).toBe(2)
      expect(result.statistics.totalSpent).toBe(30) // (1000 + 2000) / 100
    })

    it('should throw NotFoundException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(service.getUserStatistics('user-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('bulkUserOperations', () => {
    it('should perform bulk block operation', async () => {
      const users = [
        { id: 'user-1' },
        { id: 'user-2' },
      ]

      mockPrismaService.user.findMany.mockResolvedValue(users)
      mockPrismaService.user.updateMany.mockResolvedValue({})

      const result = await service.bulkUserOperations(['user-1', 'user-2'], 'block')

      expect(result.message).toContain('users blocked successfully')
    })

    it('should throw BadRequestException when some users not found', async () => {
      const users = [{ id: 'user-1' }]

      mockPrismaService.user.findMany.mockResolvedValue(users)

      await expect(service.bulkUserOperations(['user-1', 'user-2'], 'block')).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for invalid operation', async () => {
      const users = [{ id: 'user-1' }]

      mockPrismaService.user.findMany.mockResolvedValue(users)

      await expect(service.bulkUserOperations(['user-1'], 'invalid')).rejects.toThrow(BadRequestException)
    })
  })
})
