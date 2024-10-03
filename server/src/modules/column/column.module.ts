import { Module } from '@nestjs/common'
import { ColumnService } from './column.service'
import { ColumnController } from './column.controller'
import { ColumnRepository } from './column.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { SheetService } from '@sheet/sheet.service'
import { SheetRepository } from '@sheet/sheet.repository'
import { WorkspaceService } from '@workspace/workspace.service'
import { WorkspaceRepository } from '@workspace/workspace.repository'
import { TaskService } from '@task/task.service'
import { TaskRepository } from '@task/task.repository'

@Module({
  controllers: [ColumnController],
  providers: [
    ColumnService,
    ColumnRepository,
    PrismaService,
    UserService,
    UserRepository,
    RoleService,
    SheetService,
    SheetRepository,
    WorkspaceService,
    WorkspaceRepository,
    TaskService,
    TaskRepository
  ],
})
export class ColumnModule {}
