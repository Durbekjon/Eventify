import { Module, forwardRef } from '@nestjs/common'
import { SheetController } from './sheet.controller'
import { SheetService } from './sheet.service'
import { SheetRepository } from './sheet.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserModule } from '../user/user.module'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { WorkspaceModule } from '@workspace/workspace.module' // Import WorkspaceModule
import { LogRepository } from '@log/log.repository'
import { ColumnRepository } from '@column/column.repository'

@Module({
  imports: [UserModule, forwardRef(() => WorkspaceModule)], // Import WorkspaceModule with forwardRef
  controllers: [SheetController],
  providers: [
    SheetService,
    SheetRepository,
    PrismaService,
    RoleService,
    LogRepository,
    ColumnRepository,
  ],
  exports: [SheetService], // Export SheetService if needed in other modules
})
export class SheetModule {}
