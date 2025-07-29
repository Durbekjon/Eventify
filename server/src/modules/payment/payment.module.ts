import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { PaymentRepository } from './payment.repository'
import { UserModule } from '../user/user.module'
import { RoleService } from '@role/role.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { StripeService } from '@stripe/stripe.service'

@Module({
  imports: [UserModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, RoleService, PrismaService,StripeService],
})
export class PaymentModule {}
