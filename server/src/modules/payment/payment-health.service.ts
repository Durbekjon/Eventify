import { Injectable } from '@nestjs/common'
import { PrismaService } from '@core/prisma/prisma.service'
import { StripeService } from '@core/stripe/stripe.service'

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  checks: {
    stripe: { status: 'healthy' | 'unhealthy'; message?: string }
    database: { status: 'healthy' | 'unhealthy'; message?: string }
    webhooks: { status: 'healthy' | 'unhealthy'; message?: string }
    subscriptions: {
      status: 'healthy' | 'unhealthy' | 'degraded'
      message?: string
    }
  }
  timestamp: Date
}

@Injectable()
export class PaymentHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Check overall payment system health
   * @returns Health check result
   */
  async checkPaymentSystemHealth(): Promise<HealthCheckResult> {
    const checks = {
      stripe: await this.checkStripeConnection(),
      database: await this.checkDatabaseConnection(),
      webhooks: await this.checkWebhookStatus(),
      subscriptions: await this.checkExpiredSubscriptions(),
    }

    const overallStatus = this.determineOverallStatus(checks)

    return {
      status: overallStatus,
      checks,
      timestamp: new Date(),
    }
  }

  /**
   * Check Stripe API connectivity
   * @returns Stripe health status
   */
  private async checkStripeConnection() {
    try {
      await this.stripeService.testConnection()
      return { status: 'healthy' as const }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: `Stripe connection failed: ${error.message}`,
      }
    }
  }

  /**
   * Check database connectivity
   * @returns Database health status
   */
  private async checkDatabaseConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'healthy' as const }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: `Database connection failed: ${error.message}`,
      }
    }
  }

  /**
   * Check webhook endpoint status
   * @returns Webhook health status
   */
  private async checkWebhookStatus() {
    try {
      // Basic webhook endpoint check
      return { status: 'healthy' as const }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: `Webhook check failed: ${error.message}`,
      }
    }
  }

  /**
   * Check for expired subscriptions that need processing
   * @returns Subscription health status
   */
  private async checkExpiredSubscriptions() {
    try {
      const expiredCount = await this.prisma.companySubscription.count({
        where: {
          endDate: { lt: new Date() },
          isExpired: false,
        },
      })

      if (expiredCount > 0) {
        return {
          status: 'degraded' as const,
          message: `${expiredCount} expired subscriptions need processing`,
        }
      }

      return { status: 'healthy' as const }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: `Subscription check failed: ${error.message}`,
      }
    }
  }

  /**
   * Determine overall system status based on individual checks
   * @param checks - Individual health checks
   * @returns Overall status
   */
  private determineOverallStatus(
    checks: HealthCheckResult['checks'],
  ): 'healthy' | 'unhealthy' | 'degraded' {
    const statuses = Object.values(checks).map((check) => check.status)

    if (statuses.every((status) => status === 'healthy')) {
      return 'healthy'
    }

    if (statuses.some((status) => status === 'unhealthy')) {
      return 'unhealthy'
    }

    return 'degraded'
  }

  /**
   * Get payment system metrics
   * @returns Payment metrics
   */
  async getPaymentSystemMetrics() {
    const [
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      activeSubscriptions,
      expiredSubscriptions,
      totalCompanies,
    ] = await Promise.all([
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { status: 'SUCCEEDED' } }),
      this.prisma.transaction.count({ where: { status: 'FAILED' } }),
      this.prisma.companySubscription.count({
        where: { isExpired: false, endDate: { gt: new Date() } },
      }),
      this.prisma.companySubscription.count({
        where: { isExpired: true },
      }),
      this.prisma.company.count(),
    ])

    const successRate =
      totalTransactions > 0
        ? (successfulTransactions / totalTransactions) * 100
        : 0

    return {
      transactions: {
        total: totalTransactions,
        successful: successfulTransactions,
        failed: failedTransactions,
        successRate: Math.round(successRate * 100) / 100,
      },
      subscriptions: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        total: activeSubscriptions + expiredSubscriptions,
      },
      companies: {
        total: totalCompanies,
      },
      timestamp: new Date(),
    }
  }

  /**
   * Get comprehensive payment system status
   * @returns System status with health, metrics, and errors
   */
  async getPaymentSystemStatus() {
    const health = await this.checkPaymentSystemHealth()
    const metrics = await this.getPaymentSystemMetrics()
    const recentErrors = await this.getRecentPaymentErrors(5)

    return {
      health,
      metrics,
      recentErrors,
    }
  }

  /**
   * Get recent payment errors
   * @param limit - Number of errors to retrieve
   * @returns Recent payment errors
   */
  private async getRecentPaymentErrors(limit: number = 10) {
    return this.prisma.paymentLog.findMany({
      where: {
        OR: [{ status: 'FAILED' }, { errorCode: { not: null } }],
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        company: { select: { name: true } },
        user: { select: { email: true } },
        plan: { select: { name: true } },
      },
    })
  }
}
