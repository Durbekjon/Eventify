import { Module, forwardRef } from '@nestjs/common'
import { SheetController } from './sheet.controller'
import { SheetService } from './sheet.service'
import { SheetRepository } from './sheet.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { WorkspaceModule } from '@workspace/workspace.module' // Import WorkspaceModule
import { LogRepository } from '@log/log.repository'
import { ColumnRepository } from '@column/column.repository'

@Module({
  controllers: [SheetController],
  providers: [
    SheetService,
    SheetRepository,
    PrismaService,
    UserService,
    UserRepository,
    RoleService,
    LogRepository,
    ColumnRepository,
  ],
  imports: [forwardRef(() => WorkspaceModule)], // Import WorkspaceModule with forwardRef
  exports: [SheetService], // Export SheetService if needed in other modules
})
export class SheetModule {}
