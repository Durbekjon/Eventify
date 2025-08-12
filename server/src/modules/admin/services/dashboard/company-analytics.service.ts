import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import { CompanyMetrics } from '../../types/admin-metrics.types'

@Injectable()
export class CompanyAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive company analytics metrics
   */
  async getCompanyMetrics(): Promise<CompanyMetrics> {
    const [total, active, blocked, newThisMonth, newThisWeek, previousMonth] =
      await Promise.all([
        this.getTotalCompanies(),
        this.getActiveCompanies(),
        this.getBlockedCompanies(),
        this.getNewCompaniesThisMonth(),
        this.getNewCompaniesThisWeek(),
        this.getNewCompaniesPreviousMonth(),
      ])

    const growthRate = this.calculateGrowthRate(newThisMonth, previousMonth)

    return {
      total,
      active,
      blocked,
      newThisMonth,
      newThisWeek,
      growthRate,
    }
  }

  /**
   * Get company growth trends
   */
  async getCompanyGrowthTrends(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const companies = await this.prisma.company.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        isBlocked: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const dailyStats = new Map<string, { total: number; blocked: number }>()

    for (const company of companies) {
      const date = company.createdAt.toISOString().split('T')[0]
      const current = dailyStats.get(date) || { total: 0, blocked: 0 }
      current.total++
      if (company.isBlocked) current.blocked++
      dailyStats.set(date, current)
    }

    // Convert to array and fill missing dates
    const result = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const stats = dailyStats.get(dateStr) || { total: 0, blocked: 0 }

      result.unshift({
        date: dateStr,
        newCompanies: stats.total,
        blockedCompanies: stats.blocked,
      })
    }

    return result
  }

  /**
   * Get company usage patterns
   */
  async getCompanyUsagePatterns() {
    const companies = await this.prisma.company.findMany({
      include: {
        workspaces: true,
        sheets: true,
        members: true,
        tasks: {
          include: {
            sheet: true,
          },
        },
        subscriptions: {
          where: { isExpired: false },
          include: {
            plan: true,
          },
        },
      },
    })

    const usageStats = companies.map((company) => ({
      companyId: company.id,
      companyName: company.name,
      workspaces: company.workspaces.length,
      sheets: company.sheets.length,
      members: company.members.length,
      tasks: company.tasks.length,
      activeSubscription: company.subscriptions[0] || null,
      planName: company.subscriptions[0]?.plan?.name || 'No Plan',
      planPrice: company.subscriptions[0]?.plan?.price || 0, // Convert from cents to dollars
    }))

    return {
      totalCompanies: companies.length,
      averageWorkspaces: this.calculateAverage(
        usageStats.map((s) => s.workspaces),
      ),
      averageSheets: this.calculateAverage(usageStats.map((s) => s.sheets)),
      averageMembers: this.calculateAverage(usageStats.map((s) => s.members)),
      averageTasks: this.calculateAverage(usageStats.map((s) => s.tasks)),
      usageStats,
    }
  }

  /**
   * Get plan distribution across companies
   */
  async getPlanDistribution() {
    const companies = await this.prisma.company.findMany({
      include: {
        plan: true,
        subscriptions: {
          where: { isExpired: false },
          include: {
            plan: true,
          },
        },
      },
    })

    const planStats = new Map<string, { count: number; revenue: number }>()

    for (const company of companies) {
      const planName =
        company.plan?.name || company.subscriptions[0]?.plan?.name || 'No Plan'
      const planPrice =
        company.plan?.price || company.subscriptions[0]?.plan?.price || 0 // Convert from cents to dollars

      const current = planStats.get(planName) || { count: 0, revenue: 0 }
      current.count++
      current.revenue += planPrice
      planStats.set(planName, current)
    }

    return Array.from(planStats.entries()).map(([plan, stats]) => ({
      plan,
      count: stats.count,
      revenue: stats.revenue,
      percentage: (stats.count / companies.length) * 100,
    }))
  }

  /**
   * Get company health scores
   */
  async getCompanyHealthScores() {
    const companies = await this.prisma.company.findMany({
      include: {
        workspaces: true,
        sheets: true,
        members: true,
        tasks: true,
        subscriptions: {
          where: { isExpired: false },
        },
      },
    })

    return companies.map((company) => {
      const healthScore = this.calculateHealthScore(company)
      return {
        companyId: company.id,
        companyName: company.name,
        healthScore,
        workspaces: company.workspaces.length,
        sheets: company.sheets.length,
        members: company.members.length,
        tasks: company.tasks.length,
        hasActiveSubscription: company.subscriptions.length > 0,
        isBlocked: company.isBlocked,
      }
    })
  }

  /**
   * Get company activity metrics
   */
  async getCompanyActivityMetrics() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalCompanies, active30Days, active7Days] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.company.count({
        where: { updatedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.company.count({
        where: { updatedAt: { gte: sevenDaysAgo } },
      }),
    ])

    return {
      totalCompanies,
      active30Days,
      active7Days,
      retention30Days:
        totalCompanies > 0 ? (active30Days / totalCompanies) * 100 : 0,
      retention7Days:
        totalCompanies > 0 ? (active7Days / totalCompanies) * 100 : 0,
    }
  }

  // Private helper methods
  private async getTotalCompanies(): Promise<number> {
    return this.prisma.company.count()
  }

  private async getActiveCompanies(): Promise<number> {
    return this.prisma.company.count({ where: { isBlocked: false } })
  }

  private async getBlockedCompanies(): Promise<number> {
    return this.prisma.company.count({ where: { isBlocked: true } })
  }

  private async getNewCompaniesThisMonth(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    return this.prisma.company.count({
      where: { createdAt: { gte: startOfMonth } },
    })
  }

  private async getNewCompaniesThisWeek(): Promise<number> {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    return this.prisma.company.count({
      where: { createdAt: { gte: startOfWeek } },
    })
  }

  private async getNewCompaniesPreviousMonth(): Promise<number> {
    const startOfPreviousMonth = new Date()
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1)
    startOfPreviousMonth.setDate(1)
    startOfPreviousMonth.setHours(0, 0, 0, 0)

    const startOfCurrentMonth = new Date()
    startOfCurrentMonth.setDate(1)
    startOfCurrentMonth.setHours(0, 0, 0, 0)

    return this.prisma.company.count({
      where: {
        createdAt: {
          gte: startOfPreviousMonth,
          lt: startOfCurrentMonth,
        },
      },
    })
  }

  private async getNewCompaniesPreviousWeek(): Promise<number> {
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

    return this.prisma.company.count({
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

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const sum = numbers.reduce((acc, num) => acc + num, 0)
    return Math.round((sum / numbers.length) * 100) / 100
  }

  private calculateHealthScore(company: any): number {
    let score = 0

    // Base score for having an active subscription
    if (company.subscriptions.length > 0) score += 30

    // Score for activity (workspaces, sheets, tasks)
    if (company.workspaces.length > 0) score += 20
    if (company.sheets.length > 0) score += 20
    if (company.tasks.length > 0) score += 20

    // Score for team size
    if (company.members.length > 1) score += 10

    // Penalty for being blocked
    if (company.isBlocked) score -= 50

    return Math.max(0, Math.min(100, score))
  }
}
