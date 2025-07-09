import { BadRequestException, Injectable } from '@nestjs/common'
import { NotificationRepository } from './notification.repository'
import { PrismaService } from '@core/prisma/prisma.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { Prisma } from '@prisma/client'
import { IUser } from '@/modules/user/dto/IUser'
import { HTTP_MESSAGES } from '@consts/http-messages'

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createNotification(dto: CreateNotificationDto) {
    // Prepare notification data with conditional member connection
    const notificationData: Prisma.NotificationCreateInput = {
      text: dto.text,
      type: dto.type,
      from: dto.from,
      fromCompany: { connect: { id: dto.companyId } },
      toUser: { connect: { id: dto.userId } },
    }
    if (dto.member) notificationData.member = { connect: { id: dto.member } }
    // Create notification
    const notification = await this.prisma.notification.create({
      data: notificationData,
    })

    // Update the member if member is provided
    if (dto.member) {
      await this.prisma.member.update({
        where: { id: dto.member },
        data: { notification: { connect: { id: notification.id } } },
      })
    }

    return notification
  }

  async getNotificationsByUser(user: IUser) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
      include: { member: true },
    })

    return {
      notifications,
      fullRead: notifications.every((notification) => notification.isRead),
    }
  }

  async getOne(notificationId: string, user: IUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { member: true },
    })

    if (!notification) {
      throw new BadRequestException(HTTP_MESSAGES.NOTIFICATION.NOT_FOUND)
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return notification
  }

  async readAll(user: IUser) {
    const unreadNotifications = await this.prisma.notification.findMany({
      where: {
        userId: user.id,
        isRead: false,
      },
    })

    if (unreadNotifications.length === 0) {
      throw new BadRequestException(HTTP_MESSAGES.NOTIFICATION.ALREADY_READ)
    }

    await this.repository.readAll({ userId: user.id, isRead: false })

    return { status: 'OK' }
  }

  async read(notificationId: string, user: IUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId, userId: user.id },
    })

    if (!notification) {
      throw new BadRequestException(HTTP_MESSAGES.NOTIFICATION.NOT_FOUND)
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    return { status: 'OK' }
  }
}
