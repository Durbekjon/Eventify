import { Injectable } from '@nestjs/common'
import Stripe from 'stripe'
import { STRIPE } from '@consts/stripe'
import { Plan } from '@prisma/client'
import { randomUUID } from 'crypto'
import { PrismaService } from '@core/prisma/prisma.service'
import { PaymentError } from '@/modules/payment/payment.error'

@Injectable()
export class StripeService {
  private stripe: Stripe

  constructor(private readonly prisma: PrismaService) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    })
  }

  // Creates a product and price in Stripe based on a given plan
  async createProduct(
    plan: Plan,
  ): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
    const product = await this.stripe.products.create({
      id: plan.id,
      name: plan.name,
      description: plan.description,
    })

    const price = await this.stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: plan.price * 100,
    })

    return { product, price }
  }

  // Updates an existing Stripe product with the provided update parameters
  async updateProduct(
    planId: string,
    updateParams: Stripe.ProductUpdateParams,
  ): Promise<Stripe.Product> {
    return this.stripe.products.update(planId, updateParams)
  }

  // Deactivates all prices associated with the product and deletes the product from Stripe
  async deleteProduct(planId: string): Promise<void> {
    try {
      // First check if the product exists in Stripe
      try {
        await this.stripe.products.retrieve(planId)
      } catch (error) {
        // If product doesn't exist in Stripe, just return (already deleted or never existed)
        console.log(
          `Product ${planId} doesn't exist in Stripe, skipping deletion.\n${error.message}`,
        )
        return
      }

      // If product exists, proceed with deletion
      const prices = await this.stripe.prices.list({ product: planId })
      await Promise.all(
        prices.data.map((price) =>
          this.stripe.prices.update(price.id, { active: false }),
        ),
      )
      await this.stripe.products.del(planId)
    } catch (error) {
      // Log the error but don't throw - this allows the database deletion to proceed
      console.error(`Error deleting Stripe product ${planId}:`, error.message)
      // Don't throw error to allow database cleanup to continue
    }
  }

  // Creates a new price for an existing product in Stripe
  async createPrice(params: Stripe.PriceCreateParams): Promise<Stripe.Price> {
    return this.stripe.prices.create(params)
  }

  // Retrieves a list of prices based on provided parameters
  pricesList(
    params: Stripe.PriceListParams,
  ): Promise<Stripe.ApiList<Stripe.Price>> {
    return this.stripe.prices.list(params)
  }

  // Updates an existing price with the new parameters
  pricesUpdate(
    id: string,
    params: Stripe.PriceUpdateParams,
  ): Promise<Stripe.Price> {
    return this.stripe.prices.update(id, params)
  }

  // Creates a checkout session for a given plan, user, and company, and stores the transaction in the database
  async createCheckoutSession(
    plan: Plan,
    userId: string,
    companyId: string,
    customerId: string,
  ): Promise<Stripe.Checkout.Session> {
    const transactionUuid = randomUUID()

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name, description: plan.description },
          unit_amount: plan.price * 100,
        },
        quantity: 1,
      },
    ]

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: this.constructUrl(companyId, transactionUuid),
      cancel_url: this.constructUrl(companyId, transactionUuid),
      metadata: { planId: plan.id, userId, companyId },
    })

    await this.prisma.transaction.create({
      data: {
        id: transactionUuid,
        userId,
        companyId,
        planId: plan.id,
        amount: plan.price * 100,
        currency: 'usd',
        status: 'PENDING',
        sessionUrl: session.url,
      },
    })

    return session
  }

  // Retrieves the payment status of a specific checkout session
  async checkSessionPayment(sessionId: string): Promise<string> {
    if (!sessionId) {
      throw new Error('Session ID is required')
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId)
      return session.payment_status
    } catch (error) {
      console.error(
        `Error checking session payment for ${sessionId}:`,
        error.message,
      )
      throw new Error(`Unable to retrieve session: ${error.message}`)
    }
  }

  // Handles Stripe webhooks with comprehensive event processing
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        )
        break
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        )
        break
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        )
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        )
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        )
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  // Creates a "free plan" invoice without Stripe payment
  async createFreePlanInvoice(
    plan: Plan,
    userId: string,
    companyId: string,
  ): Promise<{
    subscriptionId: string
    transactionId: string
    amount: number
    currency: string
  }> {
    const transactionUuid = randomUUID()

    // Create transaction in DB with SUCCEEDED immediately
    await this.prisma.transaction.create({
      data: {
        id: transactionUuid,
        userId,
        companyId,
        planId: plan.id,
        amount: 0,
        currency: 'usd',
        status: 'SUCCEEDED',
      },
    })

    // Create subscription in DB
    const subscription = await this.prisma.companySubscription.create({
      data: {
        companyId,
        planId: plan.id,
        startDate: new Date(),
        endDate: this.calculateEndDate(),
        isExpired: false,
        status: 'ACTIVE',
      },
    })

    // Update company to unblock and set current subscription
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        currentSubscriptionId: subscription.id,
        isBlocked: false,
        plan: { connect: { id: plan.id } },
      },
    })

    console.log(`Free plan activated for company ${companyId}`)

    return {
      subscriptionId: subscription.id,
      transactionId: transactionUuid,
      amount: 0,
      currency: 'usd',
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const { planId, companyId } = session.metadata

    if (session.payment_status === 'paid') {
      await this.prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: session.metadata.transactionId },
          data: { status: 'SUCCEEDED' },
        })

        // Create subscription
        const subscription = await tx.companySubscription.create({
          data: {
            companyId,
            planId,
            startDate: new Date(),
            endDate: this.calculateEndDate(),
            stripeSubscriptionId: session.subscription as string,
            requestsCount: 0,
            isExpired: false,
          },
        })

        // Update company
        await tx.company.update({
          where: { id: companyId },
          data: {
            isBlocked: false,
            plan: { connect: { id: planId } },
            currentSubscriptionId: subscription.id,
          },
        })
      })
    }
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if (invoice.subscription) {
      const subscription = await this.prisma.companySubscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription as string },
      })

      if (subscription) {
        await this.prisma.companySubscription.update({
          where: { id: subscription.id },
          data: {
            endDate: this.calculateEndDate(),
            isExpired: false,
          },
        })

        await this.prisma.company.update({
          where: { id: subscription.companyId },
          data: {
            isBlocked: false,
            plan: { connect: { id: subscription.planId } },
            currentSubscriptionId: subscription.id,
          },
        })
      }
    }
  }

  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if (invoice.subscription) {
      const subscription = await this.prisma.companySubscription.findFirst({
        where: { stripeSubscriptionId: invoice.subscription as string },
      })

      if (subscription) {
        await this.prisma.company.update({
          where: { id: subscription.companyId },
          data: {
            isBlocked: true,
            plan: { disconnect: true },
            currentSubscriptionId: null,
          },
        })
      }
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const dbSubscription = await this.prisma.companySubscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (dbSubscription) {
      await this.prisma.company.update({
        where: { id: dbSubscription.companyId },
        data: {
          isBlocked: true,
          currentSubscriptionId: null,
          plan: { disconnect: true },
        },
      })
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const dbSubscription = await this.prisma.companySubscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })

    if (dbSubscription) {
      await this.prisma.companySubscription.update({
        where: { id: dbSubscription.id },
        data: {
          endDate: new Date(subscription.current_period_end * 1000),
          isExpired: subscription.status === 'canceled',
        },
      })
    }
  }

  private calculateEndDate(): Date {
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    endDate.setHours(0, 0, 0, 0)
    return endDate
  }

  // Create a new Stripe customer
  async createCustomer(customerData: {
    email: string
    name: string
    metadata?: Record<string, string>
  }): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      metadata: customerData.metadata,
    })
  }

  // Create a subscription
  async createSubscription(subscriptionData: {
    customerId: string
    priceId: string
    trialDays?: number
    metadata?: Record<string, string>
  }): Promise<Stripe.Subscription> {
    const params: Stripe.SubscriptionCreateParams = {
      customer: subscriptionData.customerId,
      items: [{ price: subscriptionData.priceId }],
      metadata: subscriptionData.metadata,
    }

    if (subscriptionData.trialDays) {
      params.trial_period_days = subscriptionData.trialDays
      params.trial_settings = {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      }
    }

    return this.stripe.subscriptions.create(params)
  }

  // Update a subscription
  async updateSubscription(
    subscriptionId: string,
    updateParams: Stripe.SubscriptionUpdateParams,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, updateParams)
  }

  // Cancel a subscription
  async cancelSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId)
  }

  // Test Stripe connection
  async testConnection(): Promise<void> {
    await this.stripe.accounts.list({ limit: 1 })
  }

  // Creates a payment intent for inline/embedded payment
  async createPaymentIntent(
    plan: Plan,
    userId: string,
    companyId: string,
    customerId: string,
  ) {
    const transactionUuid = randomUUID()
    // If plan is free, bypass Stripe and create invoice directly
    if (plan.price === 0) {
      return this.createFreePlanInvoice(plan, userId, companyId)
    }
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: plan.price * 100, // Convert to cents
      currency: 'usd',
      customer: customerId,
      metadata: {
        planId: plan.id,
        userId,
        companyId,
        transactionId: transactionUuid,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store transaction in database
    await this.prisma.transaction.create({
      data: {
        id: transactionUuid,
        userId,
        companyId,
        planId: plan.id,
        amount: plan.price * 100,
        currency: 'usd',
        status: 'PENDING',
        paymentIntentId: paymentIntent.id,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  }

  // Confirm payment intent and create subscription
  async confirmPaymentIntent(paymentIntentId: string): Promise<{
    subscriptionId: string
    transactionId: string
    amount: number
    currency: string
  }> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      const { planId, companyId, transactionId } = paymentIntent.metadata

      // Create subscription
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      })

      if (!plan) {
        throw new Error('Plan not found')
      }

      // Create subscription in database
      const subscription = await this.prisma.companySubscription.create({
        data: {
          companyId,
          planId,
          startDate: new Date(),
          endDate: this.calculateEndDate(),
          isExpired: false,
          status: 'ACTIVE',
        },
      })

      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'SUCCEEDED' },
      })

      // Update company subscription
      await this.prisma.company.update({
        where: { id: companyId },
        data: {
          currentSubscriptionId: subscription.id,
          isBlocked: false,
          plan: { connect: { id: plan.id } }, // Connect the plan to the company
        },
      })

      console.log(
        `Payment confirmed for company ${companyId}, subscription created`,
      )

      return {
        subscriptionId: subscription.id,
        transactionId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    } else {
      throw new PaymentError(
        `Payment failed: ${paymentIntent.status}`,
        'PAYMENT_FAILED',
        false,
        400,
      )
    }
  }

  // Helper method to construct success or cancel URLs for checkout sessions
  private constructUrl(companyId: string, transactionUuid: string): string {
    return `${STRIPE.URL}?&companyId=${companyId}&transactionId=${transactionUuid}&sessionId={CHECKOUT_SESSION_ID}`
  }
}
