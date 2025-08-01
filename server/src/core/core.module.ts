import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { UtilsModule } from './utils/utils.module'
import { EmailModule } from './email/email.module'
import { StripeModule } from './stripe/stripe.module'
import { CompanySubscriptionModule } from './company_subscription/company_subscription.module'
import { FileStorageModule } from './file-storage/file-storage.module'

@Module({
  imports: [PrismaModule, UtilsModule, EmailModule, StripeModule, CompanySubscriptionModule, FileStorageModule],
})
export class CoreModule {}
