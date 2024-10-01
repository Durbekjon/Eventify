import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@/guards/jwt-auth.guard'
import { NotificationService } from '@notification/notification.service'
import { User } from '@decorators/user.decorator'
import { IUser } from '@/modules/user/dto/IUser'

@ApiBearerAuth()
@ApiTags('Notification')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notification', version: '1' })
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  getNotifications(@User() user: IUser) {
    return this.service.getNotificationsByUser(user)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification' })
  getNotification(@User() user: IUser, @Param('id') id: string) {
    return this.service.getOne(id, user)
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all as read' })
  readAll(@User() user: IUser) {
    return this.service.readAll(user)
  }
}
