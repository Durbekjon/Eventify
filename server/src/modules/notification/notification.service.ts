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
    // "status": "string",
    // "priority": "HIGH",
    // "price": 99999,
    // "paid": true,
    // "sheetId": "90608ede-76dd-4d74-ba41-fefaf28ea2d3",
    // "workspaceId": "00e8efe8-9190-47b1-8ed0-ca018166ba6e"
    // }
    await this.prisma.task.create({
      data: {
        status: 'HIGH',
        priority: 'HIGH',
        sheet: {
          connect: { id: '90608ede-76dd-4d74-ba41-fefaf28ea2d3' },
        },
        workspace: {
          connect: { id: '00e8efe8-9190-47b1-8ed0-ca018166ba6e' },
        },
        company: { connect: { id: 'cc961461-6be0-4d84-80fe-dcead7a21769' } },
      },
    })
    const notifications = await this.prisma.notification.findMany({
      where: { userId: user.id },
    })

    return {
      notifications,
      fullRead: notifications.every((notification) => notification.isRead),
    }
  }

  async getOne(notificationId: string, user: IUser) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification) {
      throw new BadRequestException(HTTP_MESSAGES.NOTIFICATION_NOT_FOUND)
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
      throw new BadRequestException(HTTP_MESSAGES.NOTIFICATION_ALREADY_READ)
    }

    await this.repository.readAll({ userId: user.id, isRead: false })

    return { status: 'OK' }
  }
}
