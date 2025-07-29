import { ACCESS_TOKEN_EXPIRATION_TIME, JWT_SECRET } from '@consts/token'
import { CoreModule } from '@core/core.module'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthRepository } from './auth.repository'
import { JwtStrategy } from './auth.strategy'
import { UtilsService } from '@core/utils/utils.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { EmailService } from '@core/email/email.service'
import { UserModule } from '../user/user.module'

@Module({
  imports: [
    CoreModule,
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: ACCESS_TOKEN_EXPIRATION_TIME },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
    UtilsService,
    PrismaService,
    EmailService,
  ],
})
export class AuthModule {}
