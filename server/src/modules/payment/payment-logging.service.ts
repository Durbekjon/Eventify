import { Injectable } from '@nestjs/common'
import { PrismaService } from '@core/prisma/prisma.service'

export interface PaymentLogData {
  event: string
  companyId?: string
  userId?: string
  transactionId?: string
  subscriptionId?: string
  planId?: string
  amount?: number
  currency?: string
  status?: string
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

@Injectable()
export class PaymentLoggingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a payment event
   * @param data - Payment log data
   */
  async logPaymentEvent(data: PaymentLogData) {
    try {
      await this.prisma.paymentLog.create({
        data: {
          event: data.event,
          companyId: data.companyId,
          userId: data.userId,
          transactionId: data.transactionId,
          subscriptionId: data.subscriptionId,
          planId: data.planId,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to log payment event:', error)
    }
  }

  /**
   * Log payment intent creation
   * @param data - Payment intent data
   */
  async logPaymentIntentCreated(data: {
    companyId: string
    userId: string
    transactionId: string
    planId: string
    amount: number
    currency: string
  }) {
    await this.logPaymentEvent({
      event: 'PAYMENT_INTENT_CREATED',
      ...data,
      status: 'PENDING'
    })
  }

  /**
   * Log successful payment
   * @param data - Payment success data
   */
  async logPaymentSuccess(data: {
    companyId: string
    userId: string
    transactionId: string
    subscriptionId: string
    planId: string
    amount: number
    currency: string
  }) {
    await this.logPaymentEvent({
      event: 'PAYMENT_SUCCESS',
      ...data,
      status: 'SUCCEEDED'
    })
  }

  /**
   * Log payment failure
   * @param data - Payment failure data
   */
  async logPaymentFailure(data: {
    companyId: string
    userId: string
    transactionId: string
    planId: string
    amount: number
    currency: string
    errorCode: string
    errorMessage: string
  }) {
    await this.logPaymentEvent({
      event: 'PAYMENT_FAILURE',
      ...data,
      status: 'FAILED'
    })
  }

  /**
   * Log subscription creation
   * @param data - Subscription creation data
   */
  async logSubscriptionCreated(data: {
    companyId: string
    userId: string
    subscriptionId: string
    planId: string
  }) {
    await this.logPaymentEvent({
      event: 'SUBSCRIPTION_CREATED',
      ...data
    })
  }

  /**
   * Log webhook processing
   * @param data - Webhook processing data
   */
  async logWebhookProcessed(data: {
    eventType: string
    companyId?: string
    transactionId?: string
    subscriptionId?: string
    success: boolean
    errorMessage?: string
  }) {
    await this.logPaymentEvent({
      event: 'WEBHOOK_PROCESSED',
      ...data,
      status: data.success ? 'SUCCESS' : 'FAILED',
      errorMessage: data.errorMessage,
      metadata: { eventType: data.eventType }
    })
  }
} 