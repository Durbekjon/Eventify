import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { ConfigModule } from '@nestjs/config'
import { join } from 'path'

// Core modules
import { CoreModule } from './core/core.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { CompanyModule } from './modules/company/company.module'
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
import { ChatModule } from './modules/chat/chat.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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

    // Static assets serving
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client'),
      exclude: ['api*'],
    }),

    PaymentModule,

    ChatModule,
  ],
})
export class AppModule {}
