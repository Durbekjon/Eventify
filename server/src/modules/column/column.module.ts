import { Module, forwardRef } from '@nestjs/common'
import { ColumnService } from './column.service'
import { ColumnController } from './column.controller'
import { ColumnRepository } from './column.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserModule } from '../user/user.module'
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
import { UtilsModule } from '@core/utils/utils.module'
import { EmailModule } from '@core/email/email.module'
import { SubscriptionValidationService } from '@core/subscription-validation/subscription-validation.service'
import { FileService } from '../file/file.service'
import { FileRepository } from '../file/file.repository'
import { FileStorageService } from '@core/file-storage/file-storage.service'
import { TaskAuditService } from '@task/services/task-audit.service'
import { TaskAuditHelper } from '@task/utils/audit-helper'

@Module({
  imports: [
    forwardRef(() => LogModule), // Import LogModule to ensure LogRepository is available
    UserModule,
    UtilsModule,
    EmailModule,
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
    SubscriptionValidationService,
    FileService,
    FileRepository,
    FileStorageService,
    TaskAuditService,
    TaskAuditHelper,
  ],
  exports: [ColumnService], // Export ColumnService if other modules need access
})
export class ColumnModule {}
