import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { AuthModule } from './modules/auth/auth.module'
import { CompanyModule } from './modules/company/company.module'
import { RoleModule } from './modules/role/role.module'
import { NotificationModule } from './modules/notification/notification.module'
import { MemberModule } from './modules/member/member.module'
import { UserModule } from './modules/user/user.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { SheetModule } from './modules/sheet/sheet.module';

@Module({
  imports: [
    CoreModule,
    AuthModule,
    CompanyModule,
    RoleModule,
    NotificationModule,
    MemberModule,
    UserModule,
    WorkspaceModule,
    SheetModule,
  ],
})
export class AppModule {}
