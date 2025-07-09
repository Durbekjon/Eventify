import { Module } from '@nestjs/common'
import { StripeService } from './stripe.service'
import { PrismaService } from '@core/prisma/prisma.service'

@Module({
  providers: [StripeService, PrismaService],
  exports: [StripeService],
})
export class StripeModule {}
