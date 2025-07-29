import { Module } from '@nestjs/common'
import { PlanController } from './plan.controller'
import { PlanService } from './plan.service'
import { PlanRepository } from './plan.repository'
import { UserModule } from '../user/user.module'
import { RoleService } from '@role/role.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { StripeService } from '@stripe/stripe.service'

@Module({
  imports: [UserModule],
  controllers: [PlanController],
  providers: [PlanService, PlanRepository, RoleService, PrismaService, StripeService],
})
export class PlanModule {}
