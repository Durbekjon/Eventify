import { Module } from '@nestjs/common'
import { SelectController } from './select.controller'
import { SelectService } from './select.service'
import { SelectRepository } from './select.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { UserRepository } from '@user/user.repository'
import { UserModule } from '../user/user.module'
import { RoleService } from '@role/role.service'
import { OptionRepository } from '@option/option.repository'

@Module({
  imports: [UserModule],
  controllers: [SelectController],
  providers: [
    SelectService,
    SelectRepository,
    PrismaService,
    RoleService,
    OptionRepository,
  ],
})
export class SelectModule {}
