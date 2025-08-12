import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'

@ApiBearerAuth()
@ApiTags('Admin Subscription Management')
@UseGuards(AdminGuard)
@Controller({ path: 'admin/subscriptions', version: '1' })
export class SubscriptionController {
  @Get()
  @ApiOperation({ summary: 'Get subscriptions (Sprint 3)' })
  async getSubscriptions(@Admin() admin: IUser) {
    // Placeholder for Sprint 3
    return { message: 'Subscription management endpoints will be implemented in Sprint 3' }
  }
}
