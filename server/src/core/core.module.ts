import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { PrismaModule } from './prisma/prisma.module'
import { UtilsModule } from './utils/utils.module'
import { EmailModule } from './email/email.module'
import { StripeModule } from './stripe/stripe.module'
import { CompanySubscriptionModule } from './company_subscription/company_subscription.module'
import { FileStorageModule } from './file-storage/file-storage.module'
import { SubscriptionValidationModule } from './subscription-validation/subscription-validation.module'
import { BackupModule } from './backup/backup.module'
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UtilsModule,
    EmailModule,
    StripeModule,
    CompanySubscriptionModule,
    FileStorageModule,
    SubscriptionValidationModule,
    BackupModule,
    S3Module,
  ],
})
export class CoreModule {}
