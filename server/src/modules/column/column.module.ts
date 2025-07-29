import { Module, forwardRef } from '@nestjs/common'
import { ColumnService } from './column.service'
import { ColumnController } from './column.controller'
import { ColumnRepository } from './column.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserModule } from '../user/user.module'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { SheetService } from '@sheet/sheet.service'
import { SheetRepository } from '@sheet/sheet.repository'
import { WorkspaceService } from '@workspace/workspace.service'
import { WorkspaceRepository } from '@workspace/workspace.repository'
import { TaskService } from '@task/task.service'
import { TaskRepository } from '@task/task.repository'
import { LogModule } from '@log/log.module' // Import LogModule for LogRepository
import { MemberService } from '@member/member.service'
import { MemberRepository } from '@member/member.repository'
import { NotificationService } from '@notification/notification.service'
import { NotificationRepository } from '@notification/notification.repository'

@Module({
  imports: [
    forwardRef(() => LogModule), // Import LogModule to ensure LogRepository is available
    UserModule,
  ],
  controllers: [ColumnController],
  providers: [
    ColumnService,
    ColumnRepository,
    PrismaService,
    RoleService,
    SheetService,
    SheetRepository,
    WorkspaceService,
    WorkspaceRepository,
    TaskService,
    TaskRepository,
    MemberService,
    MemberRepository,
    NotificationService,
    NotificationRepository,
  ],
  exports: [ColumnService], // Export ColumnService if other modules need access
})
export class ColumnModule {}
