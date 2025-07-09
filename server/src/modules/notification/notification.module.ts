import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { PrismaService } from '@core/prisma/prisma.service'
import { NotificationRepository } from './notification.repository'

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository, PrismaService],
})
export class NotificationModule {}
