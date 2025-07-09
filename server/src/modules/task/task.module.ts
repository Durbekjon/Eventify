import { Module } from '@nestjs/common'
import { TaskService } from './task.service'
import { TaskController } from './task.controller'
import { TaskRepository } from './task.repository'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { UserRepository } from '@user/user.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { SheetService } from '@sheet/sheet.service'
import { SheetRepository } from '@sheet/sheet.repository'
import { WorkspaceService } from '@workspace/workspace.service'
import { WorkspaceRepository } from '@workspace/workspace.repository'
import { LogRepository } from '@log/log.repository'
import { ColumnRepository } from '@column/column.repository'
import { MemberService } from '@member/member.service'
import { MemberRepository } from '@member/member.repository'
import { NotificationService } from '@notification/notification.service'
import { NotificationRepository } from '@notification/notification.repository'

@Module({
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskRepository,
    UserService,
    RoleService,
    UserRepository,
    PrismaService,
    SheetService,
    SheetRepository,
    WorkspaceService,
    WorkspaceRepository,
    LogRepository,
    ColumnRepository,
    MemberService,
    MemberRepository,
    NotificationService,
    NotificationRepository,
  ],
})
export class TaskModule {}
