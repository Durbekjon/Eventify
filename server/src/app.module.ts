import { Module } from '@nestjs/common'
// import { ServeStaticModule } from '@nestjs/serve-static'
import { ConfigModule } from '@nestjs/config'

// Core modules
import { CoreModule } from './core/core.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { WorkspaceModule } from './modules/workspace/workspace.module'
import { NotificationModule } from './modules/notification/notification.module'
import { PlanModule } from './modules/plan/plan.module'
import { TaskModule } from './modules/task/task.module'
import { SheetModule } from './modules/sheet/sheet.module'
import { RoleModule } from './modules/role/role.module'
import { MemberModule } from './modules/member/member.module'
import { ColumnModule } from './modules/column/column.module'
import { SelectModule } from './modules/select/select.module'
import { OptionModule } from './modules/option/option.module'
import { LogModule } from './modules/log/log.module'
import { PaymentModule } from './modules/payment/payment.module'
import { SubscriptionModule } from './modules/subscription/subscription.module'
import { ChatModule } from './modules/chat/chat.module'
import { FileModule } from './modules/file/file.module'
import { AdminModule } from './modules/admin/admin.module'
import { CompanyModule } from './modules/company/company.module'
import { TransactionModule } from './modules/transaction/transaction.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Throttler Module
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 30,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    // Core and Auth modules
    CoreModule,
    AuthModule,
    UserModule,

    // Company and Workspace modules
    CompanyModule,
    WorkspaceModule,

    // Notification and Plan modules
    NotificationModule,
    PlanModule,

    // Task and Sheet modules
    TaskModule,
    SheetModule,

    // Role, Member, and Column modules
    RoleModule,
    MemberModule,
    ColumnModule,

    // Select and Option modules
    SelectModule,
    OptionModule,

    // Logging
    LogModule,

    // Static assets serving removed

    PaymentModule,
    SubscriptionModule,

    ChatModule,

    FileModule,

    AdminModule,

    TransactionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
