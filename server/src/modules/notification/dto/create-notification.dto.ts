import { NotificationFrom, NotificationType } from '@prisma/client'

export class CreateNotificationDto {
  text: string
  type: NotificationType
  from: NotificationFrom
  companyId: string
  userId: string
  member: string | null
}
