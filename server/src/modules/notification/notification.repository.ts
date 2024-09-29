import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  readAll(where: Prisma.NotificationWhereInput) {
    return this.prisma.notification.updateMany({
      where,
      data: { isRead: true },
    })
  }
}
