import { Module } from '@nestjs/common'
import { OptionService } from './option.service'
import { OptionController } from './option.controller'
import { OptionRepository } from './option.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { RoleService } from '@role/role.service'
import { UserService } from '@user/user.service'
import { UserRepository } from '@user/user.repository'

@Module({
  controllers: [OptionController],
  providers: [
    OptionService,
    OptionRepository,
    PrismaService,
    RoleService,
    UserService,
    UserRepository,
  ],
})
export class OptionModule {}
