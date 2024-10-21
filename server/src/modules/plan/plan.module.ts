import { Module } from '@nestjs/common'
import { PlanService } from './plan.service'
import { PlanController } from './plan.controller'
import { PlanRepository } from './plan.repository'
import { UserService } from '../user/user.service'
import { UserRepository } from '../user/user.repository'
import { RoleService } from '../role/role.service'
import { PrismaService } from '@/core/prisma/prisma.service'
import { StripeService } from '@stripe/stripe.service'

@Module({
  controllers: [PlanController],
  providers: [
    PlanService,
    PlanRepository,
    PrismaService,
    UserService,
    UserRepository,
    RoleService,
    StripeService,
  ],
})
export class PlanModule {}
