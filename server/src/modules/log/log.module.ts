import { Module } from '@nestjs/common'
import { LogController } from './log.controller'
import { LogService } from './log.service'
import { LogRepository } from './log.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'

@Module({
  controllers: [LogController], // Handles log-related HTTP requests
  providers: [
    LogService, // Centralized logging business logic
    LogRepository, // Data access for logs
    PrismaService, // Prisma for database interaction
    UserService, // User service injected if logs need user context
    UserRepository, // User data access
    RoleService, // Role service for permission checking in logs if required
  ],
  exports: [LogRepository], // Export LogRepository for use in other modules
})
export class LogModule {}
