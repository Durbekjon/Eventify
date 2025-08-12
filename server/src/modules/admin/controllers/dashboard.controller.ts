import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { AdminRateLimitGuard } from '../guards/admin-rate-limit.guard'
import { AdminCacheInterceptor } from '../interceptors/admin-cache.interceptor'
import { AdminLoggingInterceptor } from '../interceptors/admin-logging.interceptor'
import { DashboardService } from '../services/dashboard/dashboard.service'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'
import { RequireAdminPermission } from '../decorators/admin-permission.decorator'
import { AdminPermission } from '../types/admin-permissions.types'

@ApiBearerAuth()
@ApiTags('Admin Dashboard')
@UseGuards(AdminGuard, AdminRateLimitGuard)
@UseInterceptors(AdminCacheInterceptor, AdminLoggingInterceptor)
@Controller({ path: 'admin/dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get admin dashboard data' })
  @RequireAdminPermission(AdminPermission.VIEW_DASHBOARD)
  async getDashboard(@Admin() admin: IUser) {
    return this.dashboardService.getDashboardData()
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview' })
  @RequireAdminPermission(AdminPermission.VIEW_DASHBOARD)
  async getOverview(@Admin() admin: IUser) {
    return this.dashboardService.getOverview()
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent admin activity' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of activities to return' })
  @RequireAdminPermission(AdminPermission.VIEW_DASHBOARD)
  async getRecentActivity(
    @Admin() admin: IUser,
    @Query('limit') limit?: number,
  ) {
    return this.dashboardService.getRecentActivity(limit || 10)
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts' })
  @RequireAdminPermission(AdminPermission.VIEW_SYSTEM)
  async getAlerts(@Admin() admin: IUser) {
    return this.dashboardService.getAlerts()
  }

  @Get('quick-stats')
  @ApiOperation({ summary: 'Get quick stats for today' })
  @RequireAdminPermission(AdminPermission.VIEW_DASHBOARD)
  async getQuickStats(@Admin() admin: IUser) {
    return this.dashboardService.getQuickStats()
  }
}
