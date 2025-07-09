import { Module } from '@nestjs/common'
import { MemberController } from './member.controller'
import { MemberService } from './member.service'
import { MemberRepository } from './member.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { NotificationService } from '@notification/notification.service'
import { UserService } from '@user/user.service'
import { NotificationRepository } from '@notification/notification.repository'
import { UserRepository } from '@user/user.repository'
import { RoleService } from '@role/role.service'
import { LogRepository } from '@log/log.repository'

@Module({
  controllers: [MemberController],
  providers: [
    MemberService,
    MemberRepository,
    PrismaService,
    NotificationService,
    NotificationRepository,
    UserService,
    UserRepository,
    RoleService,
    LogRepository,
  ],
})
export class MemberModule {}
