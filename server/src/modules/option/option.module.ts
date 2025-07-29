import { Module } from '@nestjs/common'
import { OptionController } from './option.controller'
import { OptionService } from './option.service'
import { OptionRepository } from './option.repository'
import { UserModule } from '../user/user.module'
import { RoleService } from '@role/role.service'
import { PrismaService } from '@core/prisma/prisma.service'

@Module({
  imports: [UserModule],
  controllers: [OptionController],
  providers: [OptionService, OptionRepository, RoleService, PrismaService],
})
export class OptionModule {}
