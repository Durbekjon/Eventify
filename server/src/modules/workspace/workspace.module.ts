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
import { SubscriptionValidationModule } from '@core/subscription-validation/subscription-validation.module'
import { SubscriptionValidationService } from '@core/subscription-validation/subscription-validation.service'

@Module({
  imports: [
    forwardRef(() => SheetModule), // Handle potential circular dependency
    LogModule, // Import LogModule to make LogRepository available
    UserModule,
    SubscriptionValidationModule,
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceRepository,
    PrismaService,
    RoleService,
    SubscriptionValidationService,
  ],
  exports: [WorkspaceService], // Export WorkspaceService for use in other modules
})
export class WorkspaceModule {}
