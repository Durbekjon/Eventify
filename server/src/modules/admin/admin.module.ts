import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { DashboardController } from './controllers/dashboard.controller'
import { AnalyticsController } from './controllers/analytics.controller'
import { UserManagementController } from './controllers/user-management.controller'
import { CompanyManagementController } from './controllers/company-management.controller'
import { SubscriptionController } from './controllers/subscription.controller'
import { SystemController } from './controllers/system.controller'
import { AdminRepository } from './admin.repository'
import { AdminRateLimitGuard } from './guards/admin-rate-limit.guard'
import { AdminAuditGuard } from './guards/admin-audit.guard'
import { AdminPermissionGuard } from './guards/admin-permission.guard'
import { AdminAuditInterceptor } from './interceptors/admin-audit.interceptor'
import { AdminCacheInterceptor } from './interceptors/admin-cache.interceptor'
import { AdminLoggingInterceptor } from './interceptors/admin-logging.interceptor'
import { DashboardService } from './services/dashboard/dashboard.service'
import { UserAnalyticsService } from './services/dashboard/user-analytics.service'
import { CompanyAnalyticsService } from './services/dashboard/company-analytics.service'
import { RevenueAnalyticsService } from './services/dashboard/revenue-analytics.service'
import { UserManagementService } from './services/user-management/user-management.service'
import { CompanyManagementService } from './services/company-management/company-management.service'
import { PrismaModule } from '@core/prisma/prisma.module'
import { UserModule } from '@user/user.module'

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [
    AdminController,
    DashboardController,
    AnalyticsController,
    UserManagementController,
    CompanyManagementController,
    SubscriptionController,
    SystemController,
  ],
  providers: [
    AdminService,
    AdminRepository,

    // Guards
    AdminRateLimitGuard,
    AdminAuditGuard,
    AdminPermissionGuard,

    // Interceptors
    AdminAuditInterceptor,
    AdminCacheInterceptor,
    AdminLoggingInterceptor,

    // Services
    DashboardService,
    UserAnalyticsService,
    CompanyAnalyticsService,
    RevenueAnalyticsService,
    UserManagementService,
    CompanyManagementService,
  ],
  exports: [
    AdminService,
    AdminRepository,
    DashboardService,
    UserAnalyticsService,
    CompanyAnalyticsService,
    RevenueAnalyticsService,
    UserManagementService,
    CompanyManagementService,
  ],
})
export class AdminModule {}
