import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { SubscriptionService } from './subscription.service'
import { IUser } from '@user/dto/IUser'
import { User } from '@decorators/user.decorator'

@ApiTags('Subscription')
@Controller({ path: 'subscription', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active subscription' })
  async getActiveSubscription(@User() user: IUser) {
    return this.subscriptionService.getActiveSubscription(user.id)
  }

  @Put('upgrade')
  @ApiOperation({ summary: 'Upgrade subscription' })
  async upgradeSubscription(
    @User() user: IUser,
    @Body() body: { planId: string }
  ) {
    return this.subscriptionService.upgradeSubscription(user, body.planId)
  }

  @Delete('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(
    @User() user: IUser,
    @Query('immediate') immediate: boolean = false
  ) {
    return this.subscriptionService.cancelSubscription(user, immediate)
  }

  @Post('renew/:id')
  @ApiOperation({ summary: 'Renew subscription' })
  async renewSubscription(@Param('id') subscriptionId: string) {
    return this.subscriptionService.renewSubscription(subscriptionId)
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage report' })
  async getUsageReport(@User() user: IUser) {
    return this.subscriptionService.getUsageReport(user)
  }

  @Post('trial')
  @ApiOperation({ summary: 'Create trial subscription' })
  async createTrialSubscription(
    @User() user: IUser,
    @Body() body: { planId: string; trialDays?: number }
  ) {
    return this.subscriptionService.createTrialSubscription(
      user,
      body.planId,
      body.trialDays || 14
    )
  }
} 