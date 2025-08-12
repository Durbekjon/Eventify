import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import { UserMetrics } from '../../types/admin-metrics.types'

@Injectable()
export class UserAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive user analytics metrics
   */
  async getUserMetrics(): Promise<UserMetrics> {
    const [
      total,
      active,
      admin,
      newThisMonth,
      newThisWeek,
      previousMonth,
      previousWeek,
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveUsers(),
      this.getAdminUsers(),
      this.getNewUsersThisMonth(),
      this.getNewUsersThisWeek(),
      this.getNewUsersPreviousMonth(),
      this.getNewUsersPreviousWeek(),
    ])

    const growthRate = this.calculateGrowthRate(newThisMonth, previousMonth)

    return {
      total,
      active,
      inactive: total - active,
      admin,
      newThisMonth,
      newThisWeek,
      growthRate,
    }
  }

  /**
   * Get user growth trends
   */
  async getUserGrowthTrends(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        isAdmin: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const dailyStats = new Map<string, { total: number; admin: number }>()

    for (const user of users) {
      const date = user.createdAt.toISOString().split('T')[0]
      const current = dailyStats.get(date) || { total: 0, admin: 0 }
      current.total++
      if (user.isAdmin) current.admin++
      dailyStats.set(date, current)
    }

    // Convert to array and fill missing dates
    const result = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const stats = dailyStats.get(dateStr) || { total: 0, admin: 0 }

      result.unshift({
        date: dateStr,
        newUsers: stats.total,
        newAdmins: stats.admin,
      })
    }

    return result
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totalUsers, active30Days, active7Days, active1Day] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: { updatedAt: { gte: thirtyDaysAgo } },
        }),
        this.prisma.user.count({
          where: { updatedAt: { gte: sevenDaysAgo } },
        }),
        this.prisma.user.count({
          where: { updatedAt: { gte: oneDayAgo } },
        }),
      ])

    return {
      totalUsers,
      active30Days,
      active7Days,
      active1Day,
      retention30Days: totalUsers > 0 ? (active30Days / totalUsers) * 100 : 0,
      retention7Days: totalUsers > 0 ? (active7Days / totalUsers) * 100 : 0,
      retention1Day: totalUsers > 0 ? (active1Day / totalUsers) * 100 : 0,
    }
  }

  /**
   * Get user geographic distribution
   */
  async getUserGeographicDistribution() {
    // For now, return placeholder data
    // In a real implementation, you might have location data in user profiles
    return {
      regions: [
        { region: 'North America', count: 0, percentage: 0 },
        { region: 'Europe', count: 0, percentage: 0 },
        { region: 'Asia', count: 0, percentage: 0 },
        { region: 'Other', count: 0, percentage: 0 },
      ],
    }
  }

  /**
   * Get user activity by time of day
   */
  async getUserActivityByTime() {
    const logs = await this.prisma.log.findMany({
      where: {
        userId: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        createdAt: true,
      },
    })

    const hourlyActivity = new Array(24).fill(0)

    for (const log of logs) {
      const hour = log.createdAt.getHours()
      hourlyActivity[hour]++
    }

    return hourlyActivity.map((count, hour) => ({
      hour,
      activity: count,
    }))
  }

  // Private helper methods
  private async getTotalUsers(): Promise<number> {
    return this.prisma.user.count()
  }

  private async getActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return this.prisma.user.count({
      where: { updatedAt: { gte: thirtyDaysAgo } },
    })
  }

  private async getAdminUsers(): Promise<number> {
    return this.prisma.user.count({ where: { isAdmin: true } })
  }

  private async getNewUsersThisMonth(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    return this.prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    })
  }

  private async getNewUsersThisWeek(): Promise<number> {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return this.prisma.user.count({
      where: { createdAt: { gte: startOfWeek } },
    })
  }

  private async getNewUsersPreviousMonth(): Promise<number> {
    const startOfPreviousMonth = new Date()
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1)
    startOfPreviousMonth.setDate(1)
    startOfPreviousMonth.setHours(0, 0, 0, 0)

    const startOfCurrentMonth = new Date()
    startOfCurrentMonth.setDate(1)
    startOfCurrentMonth.setHours(0, 0, 0, 0)

    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: startOfPreviousMonth,
          lt: startOfCurrentMonth,
        },
      },
    })
  }

  private async getNewUsersPreviousWeek(): Promise<number> {
    const startOfPreviousWeek = new Date()
    startOfPreviousWeek.setDate(
      startOfPreviousWeek.getDate() - startOfPreviousWeek.getDay() - 7,
    )
    startOfPreviousWeek.setHours(0, 0, 0, 0)

    const startOfCurrentWeek = new Date()
    startOfCurrentWeek.setDate(
      startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay(),
    )
    startOfCurrentWeek.setHours(0, 0, 0, 0)

    return this.prisma.user.count({
      where: {
        createdAt: {
          gte: startOfPreviousWeek,
          lt: startOfCurrentWeek,
        },
      },
    })
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100 * 100) / 100
  }
}
