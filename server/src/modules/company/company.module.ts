import { Module } from '@nestjs/common'
import { CompanyRepository } from './company.repository'
import { CompanyService } from './company.service'
import { RoleService } from '@role/role.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { CompanyController } from './company.controller'
import { NotificationService } from '@notification/notification.service'
import { NotificationRepository } from '@notification/notification.repository'
import { LogRepository } from '@log/log.repository'
import { UserModule } from '../user/user.module'
import { PlanService } from '@plan/plan.service'
import { PlanRepository } from '@plan/plan.repository'
import { StripeService } from '@stripe/stripe.service'

@Module({
  imports: [UserModule],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    RoleService,
    PrismaService,
    NotificationService,
    NotificationRepository,
    LogRepository,
    PlanService,
    PlanRepository,
    StripeService
  ],
})
export class CompanyModule {}
