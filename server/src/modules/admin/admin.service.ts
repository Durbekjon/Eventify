import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import { IUser } from '@/modules/user/dto/IUser'

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get admin system health status
   */
  async getHealth() {
    const dbHealth = await this.checkDatabaseHealth()

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        admin: { status: 'healthy' },
      },
    }
  }

  /**
   * Get admin system overview
   */
  async getOverview(admin: IUser) {
    const [userCount, companyCount, taskCount, subscriptionCount] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.company.count(),
        this.prisma.task.count(),
        this.prisma.companySubscription.count({
          where: { isExpired: false, endDate: { gt: new Date() } },
        }),
      ])

    return {
      overview: {
        totalUsers: userCount,
        totalCompanies: companyCount,
        totalTasks: taskCount,
        activeSubscriptions: subscriptionCount,
      },
      lastUpdated: new Date().toISOString(),
      adminId: admin.id,
    }
  }

  /**
   * Get admin system statistics
   */
  async getStats(admin: IUser) {
    const [users, companies, tasks, subscriptions] = await Promise.all([
      this.getUserStats(),
      this.getCompanyStats(),
      this.getTaskStats(),
      this.getSubscriptionStats(),
    ])

    return {
      stats: {
        users,
        companies,
        tasks,
        subscriptions,
      },
      lastUpdated: new Date().toISOString(),
      adminId: admin.id,
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'healthy' }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }

  /**
   * Get user statistics
   */
  private async getUserStats() {
    const [total, active, admin] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.user.count({ where: { isAdmin: true } }),
    ])

    return {
      total,
      active: active,
      admin,
      inactive: total - active,
    }
  }

  /**
   * Get company statistics
   */
  private async getCompanyStats() {
    const [total, active, blocked] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({ where: { isBlocked: false } }),
      this.prisma.company.count({ where: { isBlocked: true } }),
    ])

    return {
      total,
      active,
      blocked,
    }
  }

  /**
   * Get task statistics
   */
  private async getTaskStats() {
    const total = await this.prisma.task.count()

    return {
      total,
    }
  }

  /**
   * Get subscription statistics
   */
  private async getSubscriptionStats() {
    const [total, active, expired] = await Promise.all([
      this.prisma.companySubscription.count(),
      this.prisma.companySubscription.count({
        where: { isExpired: false, endDate: { gt: new Date() } },
      }),
      this.prisma.companySubscription.count({
        where: { isExpired: true },
      }),
    ])

    return {
      total,
      active,
      expired,
    }
  }
}
