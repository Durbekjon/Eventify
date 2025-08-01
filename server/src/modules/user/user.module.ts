import { Module } from '@nestjs/common'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'
import { AvatarService } from './avatar.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { FileStorageModule } from '@core/file-storage/file-storage.module'
import { UtilsService } from '@core/utils/utils.service'

@Module({
  imports: [FileStorageModule],
  controllers: [UserController],
  providers: [UserService, UserRepository, AvatarService, PrismaService, UtilsService],
  exports: [UserService, AvatarService],
})
export class UserModule {}
