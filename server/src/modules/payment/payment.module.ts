import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { StripeService } from '@stripe/stripe.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { PaymentRepository } from './payment.repository'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
    StripeService,
    PrismaService,
    UserService,
    UserRepository,
    RoleService,
  ],
})
export class PaymentModule {}
