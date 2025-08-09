import { Module } from '@nestjs/common'
import { SubscriptionValidationService } from './subscription-validation.service'
import { PrismaService } from '@core/prisma/prisma.service'

@Module({
  providers: [SubscriptionValidationService, PrismaService],
  exports: [SubscriptionValidationService],
})
export class SubscriptionValidationModule {}
