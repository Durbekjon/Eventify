import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger'
import { AdminGuard } from '@/guards/admin.guard'
import { AdminRateLimitGuard } from '../guards/admin-rate-limit.guard'
import { AdminCacheInterceptor } from '../interceptors/admin-cache.interceptor'
import { AdminLoggingInterceptor } from '../interceptors/admin-logging.interceptor'
import { UserAnalyticsService } from '../services/dashboard/user-analytics.service'
import { CompanyAnalyticsService } from '../services/dashboard/company-analytics.service'
import { RevenueAnalyticsService } from '../services/dashboard/revenue-analytics.service'
import { Admin } from '@/decorators/admin.decorator'
import { IUser } from '@/modules/user/dto/IUser'
import { RequireAdminPermission } from '../decorators/admin-permission.decorator'
import { AdminPermission } from '../types/admin-permissions.types'

@ApiBearerAuth()
@ApiTags('Admin Analytics')
@UseGuards(AdminGuard, AdminRateLimitGuard)
@UseInterceptors(AdminCacheInterceptor, AdminLoggingInterceptor)
@Controller({ path: 'admin/analytics', version: '1' })
export class AnalyticsController {
  constructor(
    private readonly userAnalyticsService: UserAnalyticsService,
    private readonly companyAnalyticsService: CompanyAnalyticsService,
    private readonly revenueAnalyticsService: RevenueAnalyticsService,
  ) {}

  // User Analytics Endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get user analytics metrics' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getUserAnalytics(@Admin() admin: IUser) {
    return this.userAnalyticsService.getUserMetrics()
  }

  @Get('users/growth')
  @ApiOperation({ summary: 'Get user growth trends' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getUserGrowthTrends(
    @Admin() admin: IUser,
    @Query('days') days?: number,
  ) {
    return this.userAnalyticsService.getUserGrowthTrends(days || 30)
  }

  @Get('users/engagement')
  @ApiOperation({ summary: 'Get user engagement metrics' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getUserEngagement(@Admin() admin: IUser) {
    return this.userAnalyticsService.getUserEngagementMetrics()
  }

  @Get('users/geographic')
  @ApiOperation({ summary: 'Get user geographic distribution' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getUserGeographicDistribution(@Admin() admin: IUser) {
    return this.userAnalyticsService.getUserGeographicDistribution()
  }

  @Get('users/activity-time')
  @ApiOperation({ summary: 'Get user activity by time of day' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getUserActivityByTime(@Admin() admin: IUser) {
    return this.userAnalyticsService.getUserActivityByTime()
  }

  // Company Analytics Endpoints
  @Get('companies')
  @ApiOperation({ summary: 'Get company analytics metrics' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getCompanyAnalytics(@Admin() admin: IUser) {
    return this.companyAnalyticsService.getCompanyMetrics()
  }

  @Get('companies/growth')
  @ApiOperation({ summary: 'Get company growth trends' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getCompanyGrowthTrends(
    @Admin() admin: IUser,
    @Query('days') days?: number,
  ) {
    return this.companyAnalyticsService.getCompanyGrowthTrends(days || 30)
  }

  @Get('companies/usage')
  @ApiOperation({ summary: 'Get company usage patterns' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getCompanyUsagePatterns(@Admin() admin: IUser) {
    return this.companyAnalyticsService.getCompanyUsagePatterns()
  }

  @Get('companies/plans')
  @ApiOperation({ summary: 'Get plan distribution across companies' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getPlanDistribution(@Admin() admin: IUser) {
    return this.companyAnalyticsService.getPlanDistribution()
  }

  @Get('companies/health')
  @ApiOperation({ summary: 'Get company health scores' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getCompanyHealthScores(@Admin() admin: IUser) {
    return this.companyAnalyticsService.getCompanyHealthScores()
  }

  @Get('companies/activity')
  @ApiOperation({ summary: 'Get company activity metrics' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getCompanyActivityMetrics(@Admin() admin: IUser) {
    return this.companyAnalyticsService.getCompanyActivityMetrics()
  }

  // Revenue Analytics Endpoints
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics metrics' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getRevenueAnalytics(@Admin() admin: IUser) {
    return this.revenueAnalyticsService.getRevenueMetrics()
  }

  @Get('revenue/trends')
  @ApiOperation({ summary: 'Get revenue trends over time' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getRevenueTrends(
    @Admin() admin: IUser,
    @Query('days') days?: number,
  ) {
    return this.revenueAnalyticsService.getRevenueTrends(days || 30)
  }

  @Get('revenue/mrr')
  @ApiOperation({ summary: 'Get MRR (Monthly Recurring Revenue) analysis' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getMRRAnalysis(@Admin() admin: IUser) {
    return this.revenueAnalyticsService.getMRRAnalysis()
  }

  @Get('revenue/arr')
  @ApiOperation({ summary: 'Get ARR (Annual Recurring Revenue) analysis' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getARRAnalysis(@Admin() admin: IUser) {
    return this.revenueAnalyticsService.getARRAnalysis()
  }

  @Get('revenue/churn')
  @ApiOperation({ summary: 'Get churn analysis' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getChurnAnalysis(@Admin() admin: IUser) {
    return this.revenueAnalyticsService.getChurnAnalysis()
  }

  @Get('revenue/payment-methods')
  @ApiOperation({ summary: 'Get payment method distribution' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getPaymentMethodDistribution(@Admin() admin: IUser) {
    return this.revenueAnalyticsService.getPaymentMethodDistribution()
  }

  @Get('revenue/by-plan')
  @ApiOperation({ summary: 'Get revenue by plan' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getRevenueByPlan(@Admin() admin: IUser) {
    return this.revenueAnalyticsService.getRevenueByPlan()
  }

  // Combined Analytics Endpoint
  @Get('overview')
  @ApiOperation({ summary: 'Get comprehensive analytics overview' })
  @RequireAdminPermission(AdminPermission.VIEW_ANALYTICS)
  async getAnalyticsOverview(@Admin() admin: IUser) {
    const [users, companies, revenue] = await Promise.all([
      this.userAnalyticsService.getUserMetrics(),
      this.companyAnalyticsService.getCompanyMetrics(),
      this.revenueAnalyticsService.getRevenueMetrics(),
    ])

    return {
      users,
      companies,
      revenue,
      timestamp: new Date().toISOString(),
    }
  }
}
