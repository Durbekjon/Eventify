import { Module } from '@nestjs/common'
import { LogController } from './log.controller'
import { LogService } from './log.service'
import { LogRepository } from './log.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserModule } from '../user/user.module'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'

@Module({
  imports: [UserModule],
  controllers: [LogController], // Handles log-related HTTP requests
  providers: [
    LogService, // Centralized logging business logic
    LogRepository, // Data access for logs
    PrismaService, // Prisma for database interaction
    RoleService, // Role service for permission checking in logs if required
  ],
  exports: [LogRepository], // Export LogRepository for use in other modules
})
export class LogModule {}
