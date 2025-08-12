import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/core/prisma/prisma.service'
import { RevenueMetrics } from '../../types/admin-metrics.types'

@Injectable()
export class RevenueAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive revenue analytics metrics
   */
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    const [
      total,
      monthly,
      annual,
      averageTransaction,
      successRate,
      previousMonth,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.getMonthlyRevenue(),
      this.getAnnualRevenue(),
      this.getAverageTransactionValue(),
      this.getPaymentSuccessRate(),
      this.getPreviousMonthRevenue(),
    ])

    const growthRate = this.calculateGrowthRate(monthly, previousMonth)

    return {
      total,
      monthly,
      annual,
      averageTransaction,
      successRate,
      growthRate,
    }
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        createdAt: true,
        currency: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const dailyRevenue = new Map<string, number>()

    for (const transaction of transactions) {
      const date = transaction.createdAt.toISOString().split('T')[0]
      const current = dailyRevenue.get(date) || 0
      dailyRevenue.set(date, current + transaction.amount / 100) // Convert from cents
    }

    // Convert to array and fill missing dates
    const result = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const revenue = dailyRevenue.get(dateStr) || 0

      result.unshift({
        date: dateStr,
        revenue: Math.round(revenue * 100) / 100,
      })
    }

    return result
  }

  /**
   * Get MRR (Monthly Recurring Revenue) analysis
   */
  async getMRRAnalysis() {
    const now = new Date()
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [currentMRR, previousMRR] = await Promise.all([
      this.calculateMRR(endOfCurrentMonth),
      this.calculateMRR(endOfPreviousMonth),
    ])

    const mrrGrowthRate = this.calculateGrowthRate(currentMRR, previousMRR)

    return {
      currentMRR,
      previousMRR,
      mrrGrowth: currentMRR - previousMRR,
      mrrGrowthRate,
    }
  }

  /**
   * Get ARR (Annual Recurring Revenue) analysis
   */
  async getARRAnalysis() {
    const now = new Date()
    const endOfCurrentYear = new Date(now.getFullYear(), 11, 31)
    const endOfPreviousYear = new Date(now.getFullYear() - 1, 11, 31)

    const [currentARR, previousARR] = await Promise.all([
      this.calculateARR(endOfCurrentYear),
      this.calculateARR(endOfPreviousYear),
    ])

    const arrGrowthRate = this.calculateGrowthRate(currentARR, previousARR)

    return {
      currentARR,
      previousARR,
      arrGrowth: currentARR - previousARR,
      arrGrowthRate,
    }
  }

  /**
   * Get churn analysis
   */
  async getChurnAnalysis() {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [activeSubscriptions, churnedSubscriptions] = await Promise.all([
      this.prisma.companySubscription.count({
        where: {
          isExpired: false,
          endDate: { gt: now },
        },
      }),
      this.prisma.companySubscription.count({
        where: {
          isExpired: true,
          endDate: { gte: thirtyDaysAgo, lte: now },
        },
      }),
    ])

    const totalSubscriptions = activeSubscriptions + churnedSubscriptions
    const churnRate =
      totalSubscriptions > 0
        ? (churnedSubscriptions / totalSubscriptions) * 100
        : 0

    return {
      activeSubscriptions,
      churnedSubscriptions,
      totalSubscriptions,
      churnRate: Math.round(churnRate * 100) / 100,
    }
  }

  /**
   * Get payment method distribution
   */
  async getPaymentMethodDistribution() {
    const transactions = await this.prisma.transaction.findMany({
      where: { status: 'SUCCEEDED' },
      select: {
        amount: true,
        currency: true,
        paymentIntentId: true,
      },
    })

    // For now, we'll assume all payments are via Stripe
    // In a real implementation, you might have payment method data
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount / 100, 0)

    return {
      paymentMethods: [
        {
          method: 'Stripe',
          count: transactions.length,
          amount: Math.round(totalAmount * 100) / 100,
          percentage: 100,
        },
      ],
      totalTransactions: transactions.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
    }
  }

  /**
   * Get revenue by plan
   */
  async getRevenueByPlan() {
    const subscriptions = await this.prisma.companySubscription.findMany({
      where: { isExpired: false },
      include: {
        plan: true,
        company: true,
      },
    })

    const planRevenue = new Map<
      string,
      { count: number; revenue: number; planName: string }
    >()

    for (const subscription of subscriptions) {
      const planName = subscription.plan?.name || 'Unknown Plan'
      const planPrice = (subscription.plan?.price || 0) / 100 // Convert from cents to dollars

      const current = planRevenue.get(planName) || {
        count: 0,
        revenue: 0,
        planName,
      }
      current.count++
      current.revenue += planPrice
      planRevenue.set(planName, current)
    }

    return Array.from(planRevenue.values()).map((plan) => ({
      planName: plan.planName,
      count: plan.count,
      revenue: Math.round(plan.revenue * 100) / 100,
      percentage:
        (plan.revenue / this.calculateTotalRevenue(planRevenue)) * 100,
    }))
  }

  // Private helper methods
  private async getTotalRevenue(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true },
    })

    return (result._sum.amount || 0) / 100
  }

  private async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const result = await this.prisma.transaction.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    })

    return (result._sum.amount || 0) / 100
  }

  private async getAnnualRevenue(): Promise<number> {
    const startOfYear = new Date()
    startOfYear.setMonth(0, 1)
    startOfYear.setHours(0, 0, 0, 0)

    const result = await this.prisma.transaction.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startOfYear },
      },
      _sum: { amount: true },
    })

    return (result._sum.amount || 0) / 100 || 0
  }

  private async getAverageTransactionValue(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: { status: 'SUCCEEDED' },
      _avg: { amount: true },
    })

    return (result._avg.amount || 0) / 100
  }

  private async getPaymentSuccessRate(): Promise<number> {
    const [successful, total] = await Promise.all([
      this.prisma.transaction.count({ where: { status: 'SUCCEEDED' } }),
      this.prisma.transaction.count(),
    ])

    return total > 0 ? (successful / total) * 100 : 0
  }

  private async getPreviousMonthRevenue(): Promise<number> {
    const startOfPreviousMonth = new Date()
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1, 1)
    startOfPreviousMonth.setHours(0, 0, 0, 0)

    const startOfCurrentMonth = new Date()
    startOfCurrentMonth.setDate(1)
    startOfCurrentMonth.setHours(0, 0, 0, 0)

    const result = await this.prisma.transaction.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: {
          gte: startOfPreviousMonth,
          lt: startOfCurrentMonth,
        },
      },
      _sum: { amount: true },
    })

    return (result._sum.amount || 0) / 100
  }

  private async getPreviousYearRevenue(): Promise<number> {
    const startOfPreviousYear = new Date()
    startOfPreviousYear.setFullYear(startOfPreviousYear.getFullYear() - 1, 0, 1)
    startOfPreviousYear.setHours(0, 0, 0, 0)

    const startOfCurrentYear = new Date()
    startOfCurrentYear.setMonth(0, 1)
    startOfCurrentYear.setHours(0, 0, 0, 0)

    const result = await this.prisma.transaction.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: {
          gte: startOfPreviousYear,
          lt: startOfCurrentYear,
        },
      },
      _sum: { amount: true },
    })

    return (result._sum.amount || 0) / 100
  }

  private async calculateMRR(asOfDate: Date): Promise<number> {
    const subscriptions = await this.prisma.companySubscription.findMany({
      where: {
        startDate: { lte: asOfDate },
        // OR: [{ endDate: null }, { endDate: { gt: asOfDate } }],
        isExpired: false,
      },
      include: {
        plan: true,
      },
    })

    const totalMRR = subscriptions.reduce(
      (sum, sub) => sum + (sub.plan?.price || 0),
      0,
    )

    return Math.round(totalMRR * 100) / 100
  }

  private async calculateARR(asOfDate: Date): Promise<number> {
    const mrr = await this.calculateMRR(asOfDate)
    return mrr * 12
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100 * 100) / 100
  }

  private calculateTotalRevenue(planRevenue: Map<string, any>): number {
    return Array.from(planRevenue.values()).reduce(
      (sum, plan) => sum + plan.revenue,
      0,
    )
  }
}
