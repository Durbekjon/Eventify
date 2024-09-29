import { Module, forwardRef } from '@nestjs/common'
import { WorkspaceController } from './workspace.controller'
import { WorkspaceService } from './workspace.service'
import { WorkspaceRepository } from './workspace.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserService } from '../user/user.service'
import { UserRepository } from '../user/user.repository'
import { RoleService } from '../role/role.service'
import { SheetModule } from '../sheet/sheet.module' // Import SheetModule

@Module({
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceRepository,
    PrismaService,
    UserService,
    UserRepository,
    RoleService,
  ],
  imports: [forwardRef(() => SheetModule)], // Import SheetModule with forwardRef
  exports: [WorkspaceService], // Export WorkspaceService if needed in other modules
})
export class WorkspaceModule {}
