import { Module, forwardRef } from '@nestjs/common'
import { WorkspaceController } from './workspace.controller'
import { WorkspaceService } from './workspace.service'
import { WorkspaceRepository } from './workspace.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserModule } from '../user/user.module'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { SheetModule } from '@sheet/sheet.module' // Import SheetModule with forwardRef
import { LogModule } from '@log/log.module' // Import LogModule to provide LogRepository

@Module({
  imports: [
    forwardRef(() => SheetModule), // Handle potential circular dependency
    LogModule, // Import LogModule to make LogRepository available
    UserModule,
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceRepository,
    PrismaService,
    RoleService,
  ],
  exports: [WorkspaceService], // Export WorkspaceService for use in other modules
})
export class WorkspaceModule {}
