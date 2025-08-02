import { Module } from '@nestjs/common'
import { SubscriptionService } from './subscription.service'
import { SubscriptionController } from './subscription.controller'
import { PrismaModule } from '@core/prisma/prisma.module'
import { StripeModule } from '@core/stripe/stripe.module'
import { UserModule } from '@user/user.module'
import { RoleModule } from '@role/role.module'

@Module({
  imports: [PrismaModule, StripeModule, UserModule, RoleModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {} 