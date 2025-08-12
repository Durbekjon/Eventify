import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get users with pagination and filtering
   */
  async getUsers(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit

    const where = this.buildUserFilters(filters)

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get companies with pagination and filtering
   */
  async getCompanies(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit

    const where = this.buildCompanyFilters(filters)

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          subscriptions: {
            where: { isExpired: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.company.count({ where }),
    ])

    return {
      companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get subscriptions with pagination and filtering
   */
  async getSubscriptions(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit

    const where = this.buildSubscriptionFilters(filters)

    const [subscriptions, total] = await Promise.all([
      this.prisma.companySubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      }),
      this.prisma.companySubscription.count({ where }),
    ])

    return {
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      activeCompanies,
      totalTasks,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { isBlocked: false } }),
      this.prisma.task.count(),
      this.prisma.companySubscription.count(),
      this.prisma.companySubscription.count({
        where: { isExpired: false, endDate: { gt: new Date() } },
      }),
      this.getTotalRevenue(),
    ])

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      companies: {
        total: totalCompanies,
        active: activeCompanies,
        blocked: totalCompanies - activeCompanies,
      },
      tasks: {
        total: totalTasks,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        expired: totalSubscriptions - activeSubscriptions,
      },
      revenue: {
        total: totalRevenue,
      },
    }
  }

  /**
   * Build user filters
   */
  private buildUserFilters(filters?: any) {
    const where: any = {}

    if (filters?.email) {
      where.email = { contains: filters.email, mode: 'insensitive' }
    }

    if (filters?.isAdmin !== undefined) {
      where.isAdmin = filters.isAdmin
    }

    if (filters?.createdAt) {
      where.createdAt = {
        gte: new Date(filters.createdAt),
      }
    }

    return where
  }

  /**
   * Build company filters
   */
  private buildCompanyFilters(filters?: any) {
    const where: any = {}

    if (filters?.name) {
      where.name = { contains: filters.name, mode: 'insensitive' }
    }

    if (filters?.isBlocked !== undefined) {
      where.isBlocked = filters.isBlocked
    }

    if (filters?.createdAt) {
      where.createdAt = {
        gte: new Date(filters.createdAt),
      }
    }

    return where
  }

  /**
   * Build subscription filters
   */
  private buildSubscriptionFilters(filters?: any) {
    const where: any = {}

    if (filters?.isExpired !== undefined) {
      where.isExpired = filters.isExpired
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.createdAt) {
      where.createdAt = {
        gte: new Date(filters.createdAt),
      }
    }

    return where
  }

  /**
   * Calculate total revenue
   */
  private async getTotalRevenue() {
    const result = await this.prisma.transaction.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    })

    return result._sum.amount / 100 || 0
  }
}
