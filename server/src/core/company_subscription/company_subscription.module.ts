import { Module } from '@nestjs/common'
import { CompanySubscriptionService } from './company_subscription.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CompanySubscriptionService, PrismaService],
})
export class CompanySubscriptionModule {}
