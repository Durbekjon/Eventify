import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { AuthModule } from './modules/auth/auth.module'
import { CompanyModule } from './modules/company/company.module'
import { RoleModule } from './modules/role/role.module'
import { NotificationModule } from './modules/notification/notification.module'
import { MemberModule } from './modules/member/member.module'
import { UserModule } from './modules/user/user.module'
import { WorkspaceModule } from './modules/workspace/workspace.module'
import { SheetModule } from './modules/sheet/sheet.module'
import { PlanModule } from './modules/plan/plan.module'
import { SelectModule } from './modules/select/select.module'
import { TaskModule } from './modules/task/task.module'
import { ColumnModule } from './modules/column/column.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ConfigModule } from '@nestjs/config'
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CoreModule,
    AuthModule,
    UserModule,
    PlanModule,
    NotificationModule,
    CompanyModule,
    WorkspaceModule,
    SheetModule,
    TaskModule,
    SelectModule,
    MemberModule,
    RoleModule,
    ColumnModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['api*'],
    }),
  ],
})
export class AppModule {}
