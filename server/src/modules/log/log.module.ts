import { Module } from '@nestjs/common'
import { LogController } from './log.controller'
import { LogService } from './log.service'
import { LogRepository } from './log.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'

@Module({
  controllers: [LogController],
  providers: [
    LogService,
    LogRepository,
    PrismaService,
    UserService,
    UserRepository,
    RoleService,
  ],
})
export class LogModule {}
