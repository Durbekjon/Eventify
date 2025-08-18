import { Module } from '@nestjs/common'
import { BackupService } from './backup.service'
import { PrismaModule } from '@core/prisma/prisma.module'
import { S3Module } from '@core/s3/s3.module'

@Module({
  imports: [PrismaModule, S3Module],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
