import { Module } from '@nestjs/common'
import { MemberController } from './member.controller'
import { MemberService } from './member.service'
import { MemberRepository } from './member.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { NotificationService } from '@notification/notification.service'
import { UserModule } from '../user/user.module'
import { NotificationRepository } from '@notification/notification.repository'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { LogRepository } from '@log/log.repository'
import { UtilsModule } from '@core/utils/utils.module'
import { EmailModule } from '@core/email/email.module'
import { SubscriptionValidationModule } from '@core/subscription-validation/subscription-validation.module'

@Module({
  imports: [UserModule, UtilsModule, EmailModule, SubscriptionValidationModule],
  controllers: [MemberController],
  providers: [
    MemberService,
    MemberRepository,
    PrismaService,
    NotificationService,
    NotificationRepository,
    RoleService,
    LogRepository,
  ],
})
export class MemberModule {}
