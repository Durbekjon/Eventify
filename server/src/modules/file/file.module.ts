import { Module } from '@nestjs/common'
import { FileController } from './file.controller'
import { FileService } from './file.service'
import { FileRepository } from './file.repository'
import { FileStorageModule } from '@core/file-storage/file-storage.module'
import { UserModule } from '../user/user.module'
import { RoleModule } from '../role/role.module'
import { PrismaService } from '@core/prisma/prisma.service'

@Module({
  imports: [FileStorageModule, UserModule, RoleModule],
  controllers: [FileController],
  providers: [FileService, FileRepository, PrismaService],
  exports: [FileService],
})
export class FileModule {}
