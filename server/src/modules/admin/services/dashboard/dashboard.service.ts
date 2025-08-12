import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import {
  AdminDashboardData,
  AdminOverview,
  QuickStats,
} from '../../types/admin-metrics.types'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<AdminDashboardData> {
    const [overview, recentActivity, alerts, quickStats] = await Promise.all([
      this.getOverview(),
      this.getRecentActivity(),
      this.getAlerts(),
      this.getQuickStats(),
    ])

    return {
      overview,
      recentActivity,
      alerts,
      quickStats,
    }
  }

  /**
   * Get dashboard overview
   */
  async getOverview(): Promise<AdminOverview> {
    const [
      totalUsers,
      totalCompanies,
      totalTasks,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.task.count(),
      this.prisma.companySubscription.count({
        where: { isExpired: false, endDate: { gt: new Date() } },
      }),
      this.getTotalRevenue(),
    ])

    return {
      totalUsers,
      totalCompanies,
      totalTasks,
      activeSubscriptions,
      totalRevenue,
      systemStatus: 'healthy',
    }
  }

  /**
   * Get recent admin activity
   */
  async getRecentActivity(limit: number = 10) {
    const logs = await this.prisma.log.findMany({
      where: {
        userId: {
          not: null,
        },
        companyId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return logs.map((log) => ({
      id: log.id,
      type: log.updatedKey || 'unknown',
      description: log.message,
      timestamp: log.createdAt,
      adminId: log.userId,
      resourceId: log.newValue || '',
      details: { updatedKey: log.updatedKey, oldValue: log.oldValue },
    }))
  }

  /**
   * Get system alerts
   */
  async getAlerts() {
    // For now, return empty array
    // In a real implementation, you might check for:
    // - High error rates
    // - System performance issues
    // - Security threats
    // - Payment failures
    return []
  }

  /**
   * Get quick stats for today
   */
  async getQuickStats(): Promise<QuickStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [usersToday, companiesToday, revenueToday, errorsToday] =
      await Promise.all([
        this.prisma.user.count({
          where: { createdAt: { gte: today } },
        }),
        this.prisma.company.count({
          where: { createdAt: { gte: today } },
        }),
        this.getTodayRevenue(),
        this.getTodayErrors(),
      ])

    return {
      usersToday,
      companiesToday,
      revenueToday,
      errorsToday,
    }
  }

  /**
   * Get total revenue
   */
  private async getTotalRevenue(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    })

    return result._sum.amount / 100 || 0
  }

  /**
   * Get today's revenue
   */
  private async getTodayRevenue(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const result = await this.prisma.transaction.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    })

    return result._sum.amount || 0
  }

  /**
   * Get today's errors (placeholder)
   */
  private async getTodayErrors(): Promise<number> {
    // In a real implementation, you might count error logs
    return 0
  }
}
