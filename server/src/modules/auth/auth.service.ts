import { PrismaService } from '@core/prisma/prisma.service'
import { UtilsService } from '@core/utils/utils.service'
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  // OnModuleInit,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthRepository } from './auth.repository'
import { EmailService } from '@core/email/email.service'
import { LoginDto } from './dto/login.dto'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { REFRESH_TOKEN_EXPIRATION_TIME } from '@consts/token'
import { ReshreshTokenDto } from './dto/refresh.dto'
import {
  RegistrationDto,
  RestoreAccountDto,
  RestoreAccountVerifyDto,
  VerifyRegistrationOtp,
} from './dto/registration.dto'

@Injectable()
//  implements OnModuleInit
export class AuthService {
  constructor(
    private readonly utils: UtilsService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly repository: AuthRepository,
    private readonly emailService: EmailService,
  ) {}

  // async onModuleInit() {
  //   const response = await this.login({
  //     email: process.env.ADMIN_EMAIL,
  //     password: process.env.ADMIN_PASSWORD,
  //   })

  //   console.log(response.token)
  // }

  async login(body: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      include: {
        roles: true,
      },
    })
    if (!user) throw new BadRequestException(HTTP_MESSAGES.USER.NOT_FOUND)
    const isCorrectPassword = await this.utils.compareHash(
      body.password,
      user.password,
    )
    if (!isCorrectPassword) {
      throw new BadRequestException(HTTP_MESSAGES.AUTH.WRONG_PASSWORD)
    }
    delete user.password

    const payload = { id: user.id, email: user.email }

    return {
      user,
      token: this.generateTokens(payload),
    }
  }

  private generateTokens(payload: { id: string; email: string }): {
    access: string
    refresh: string
  } {
    const access = this.jwtService.sign(payload)

    const refresh = this.jwtService.sign(payload, {
      expiresIn: REFRESH_TOKEN_EXPIRATION_TIME,
    })

    return { access, refresh }
  }

  async refreshToken(body: ReshreshTokenDto) {
    try {
      const decodedToken = this.jwtService.decode(body.refreshToken)
      if (!decodedToken) throw new Error('Invalid token')

      const { id, exp } = decodedToken as { id; role; exp }

      const isTokenExpired = Date.now() >= exp * 1000

      if (isTokenExpired) {
        throw new Error('Token expired')
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      })
      if (!user) throw new Error(HTTP_MESSAGES.USER.NOT_FOUND)

      const payload = { id: user.id, email: user.email }

      return {
        token: this.generateTokens(payload),
      }
    } catch (error) {
      throw new ForbiddenException(error.message)
    }
  }

  async registration({
    email,
    password,
  }: RegistrationDto): Promise<{ token: string }> {
    const existingUser = await this.repository.getUserByEmail(email)

    if (existingUser) {
      throw new BadRequestException(HTTP_MESSAGES.USER.EXISTS)
    }

    const otp = this.utils.generateOtp()
    await this.emailService.sendRegistrationOtp(email, otp)

    const result = await this.prisma.verificationCodes.upsert({
      where: { email },
      update: {
        otp,
        password: await this.utils.generateBcrypt(password),
        createdAt: new Date(),
      },
      create: {
        otp,
        email,
        password: await this.utils.generateBcrypt(password),
      },
    })

    return { token: result.id }
  }

  async verifyRegistrationOtp(body: VerifyRegistrationOtp) {
    try {
      const verificationCode = await this.prisma.verificationCodes.findUnique({
        where: {
          id: body.token,
        },
      })

      if (!verificationCode) throw new Error('Incorrect OTP')

      if (this.utils.isOtpExpired(verificationCode.createdAt)) {
        await this.prisma.verificationCodes.delete({
          where: { id: body.token },
        })
        throw new Error('OTP is expired')
      }

      if (body.otp !== verificationCode.otp) {
        throw new Error('Incorrect OTP')
      }

      const deleteVerificationCode = this.prisma.verificationCodes.delete({
        where: { id: verificationCode.id },
      })
      const createUser = this.prisma.user.create({
        data: {
          firstName: verificationCode.firstName,
          lastName: verificationCode.lastName,
          email: verificationCode.email,
          password: verificationCode.password,
        },
      })
      const result = await this.prisma.$transaction([
        deleteVerificationCode,
        createUser,
      ])
      const user = result[1]
      delete user.password

      return {
        user,
        token: this.generateTokens({ id: user.id, email: user.email }),
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }

  async restoreAccount(body: RestoreAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    })
    if (!user) throw new BadRequestException(HTTP_MESSAGES.USER.NOT_FOUND)

    const otp = this.utils.generateOtp()

    await this.prisma.restoreCodes.upsert({
      where: { email: user.email },
      update: {
        otp,
        createdAt: new Date(),
      },
      create: {
        otp,
        email: user.email,
      },
    })

    await this.emailService.sendRestoreAccountOtp(user.email, otp)

    return { message: 'Restore password sent' }
  }

  async restoreAccountVerify(body: RestoreAccountVerifyDto) {
    try {
      const { email } = body
      const existingCode = await this.prisma.restoreCodes.findUnique({
        where: { email },
      })

      if (!existingCode) {
        throw new Error('OTP expired or not found')
      }

      if (this.utils.isOtpExpired(existingCode.createdAt)) {
        await this.prisma.restoreCodes.delete({
          where: { email },
        })
        throw new Error('OTP is expired')
      }

      if (body.otp !== existingCode.otp) {
        throw new Error('Incorrect OTP')
      }

      const user = await this.repository.getUserByEmail(email)

      if (!user) {
        throw new Error('User not found')
      }

      await this.prisma.restoreCodes.delete({
        where: { email },
      })

      return {
        user,
        token: this.generateTokens({ id: user.id, email: user.email }),
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }
  }
}
