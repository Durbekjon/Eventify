import { Module } from '@nestjs/common'
import { CompanyRepository } from './company.repository'
import { CompanyService } from './company.service'
import { RoleService } from '@role/role.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { CompanyController } from './company.controller'
import { MemberService } from '@member/member.service'
import { MemberRepository } from '@member/member.repository'
import { NotificationService } from '@notification/notification.service'
import { UserService } from '@user/user.service'
import { NotificationRepository } from '@notification/notification.repository'
import { UserRepository } from '@user/user.repository'
import { StripeService } from '@core/stripe/stripe.service'

@Module({
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    RoleService,
    PrismaService,
    MemberService,
    MemberRepository,
    NotificationService,
    UserService,
    NotificationRepository,
    UserRepository,
    StripeService,
    UserService,
    UserRepository,
  ],
})
export class CompanyModule {}
