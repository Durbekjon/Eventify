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
        type: 'new_subscription',
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

  /**
   * Creates a payment intent specifically for subscription upgrades
   * @param plan - New plan to upgrade to
   * @param userId - User ID
   * @param companyId - Company ID
   * @param customerId - Stripe customer ID
   * @param currentSubscriptionId - Current Stripe subscription ID
   * @param prorationAmount - Calculated proration amount in cents
   * @returns Payment intent with client secret for upgrade
   */
  async createUpgradePaymentIntent(
    plan: Plan,
    userId: string,
    companyId: string,
    customerId: string,
    currentSubscriptionId: string,
    prorationAmount: number,
  ) {
    const transactionUuid = randomUUID()

    // If proration is negative (downgrade), no additional payment needed
    if (prorationAmount <= 0) {
      return this.processUpgradeWithoutPayment(
        plan,
        userId,
        companyId,
        currentSubscriptionId,
        transactionUuid,
      )
    }

    // Create payment intent for the proration amount
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: prorationAmount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        planId: plan.id,
        userId,
        companyId,
        transactionId: transactionUuid,
        type: 'subscription_upgrade',
        currentSubscriptionId,
        prorationAmount: prorationAmount.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Store upgrade transaction in database
    await this.prisma.transaction.create({
      data: {
        id: transactionUuid,
        userId,
        companyId,
        planId: plan.id,
        amount: prorationAmount,
        currency: 'usd',
        status: 'PENDING',
        paymentIntentId: paymentIntent.id,
      },
    })

    // Create payment log for upgrade tracking
    await this.prisma.paymentLog.create({
      data: {
        event: 'SUBSCRIPTION_UPGRADE_INTENT_CREATED',
        companyId,
        userId,
        transactionId: transactionUuid,
        planId: plan.id,
        amount: prorationAmount,
        currency: 'usd',
        status: 'PENDING',
        metadata: JSON.stringify({
          type: 'subscription_upgrade',
          currentSubscriptionId,
          prorationAmount,
        }),
      },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      isUpgrade: true,
      prorationAmount,
    }
  }

  /**
   * Processes upgrade without additional payment (downgrades or same price)
   * @param plan - New plan
   * @param userId - User ID
   * @param companyId - Company ID
   * @param currentSubscriptionId - Current subscription ID
   * @param transactionId - Transaction ID
   * @returns Upgrade result
   */
  private async processUpgradeWithoutPayment(
    plan: Plan,
    userId: string,
    companyId: string,
    currentSubscriptionId: string,
    transactionId: string,
  ) {
    try {
      // Update Stripe subscription immediately
      if (currentSubscriptionId) {
        await this.stripe.subscriptions.update(currentSubscriptionId, {
          items: [
            {
              id: await this.getSubscriptionItemId(currentSubscriptionId),
              price: plan.stripePriceId || '',
            },
          ],
          proration_behavior: 'none', // No proration for immediate changes
        })
      }

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          id: transactionId,
          userId,
          companyId,
          planId: plan.id,
          amount: 0,
          currency: 'usd',
          status: 'SUCCEEDED',
        },
      })

      // Create payment log for upgrade tracking
      await this.prisma.paymentLog.create({
        data: {
          event: 'SUBSCRIPTION_UPGRADED_IMMEDIATE',
          companyId,
          userId,
          transactionId,
          planId: plan.id,
          amount: 0,
          currency: 'usd',
          status: 'SUCCEEDED',
          metadata: JSON.stringify({
            type: 'subscription_upgrade',
            currentSubscriptionId,
            prorationAmount: 0,
          }),
        },
      })

      // Update subscription in database
      await this.updateSubscriptionPlan(
        companyId,
        plan.id,
        currentSubscriptionId,
      )

      return {
        clientSecret: null,
        paymentIntentId: null,
        isUpgrade: true,
        prorationAmount: 0,
        message:
          'Subscription upgraded successfully without additional payment',
      }
    } catch (error) {
      console.error('Error processing upgrade without payment:', error)
      throw new Error('Failed to process subscription upgrade')
    }
  }

  /**
   * Gets customer ID from subscription
   * @param subscriptionId - Stripe subscription ID
   * @returns Customer ID
   */
  private async getCustomerFromSubscription(
    subscriptionId: string,
  ): Promise<string> {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required to get customer')
    }

    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId)
      return subscription.customer as string
    } catch (error) {
      console.error(`Error retrieving subscription ${subscriptionId}:`, error)
      throw new Error(`Failed to retrieve subscription: ${error.message}`)
    }
  }

  /**
   * Gets subscription item ID for updating
   * @param subscriptionId - Stripe subscription ID
   * @returns Subscription item ID
   */
  private async getSubscriptionItemId(subscriptionId: string): Promise<string> {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required to get subscription item')
    }

    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId)
      if (!subscription.items?.data?.length) {
        throw new Error('No subscription items found')
      }
      return subscription.items.data[0].id
    } catch (error) {
      console.error(
        `Error retrieving subscription item for ${subscriptionId}:`,
        error,
      )
      throw new Error(`Failed to retrieve subscription item: ${error.message}`)
    }
  }

  /**
   * Updates subscription plan in database
   * @param companyId - Company ID
   * @param newPlanId - New plan ID
   * @param stripeSubscriptionId - Stripe subscription ID
   */
  private async updateSubscriptionPlan(
    companyId: string,
    newPlanId: string,
    stripeSubscriptionId: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Update company subscription
      await tx.companySubscription.updateMany({
        where: {
          companyId,
          stripeSubscriptionId,
          isExpired: false,
        },
        data: {
          planId: newPlanId,
          updatedAt: new Date(),
        },
      })

      // Update company plan reference
      await tx.company.update({
        where: { id: companyId },
        data: { planId: newPlanId },
      })
    })
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
      const { type } = paymentIntent.metadata

      // Handle different payment types
      if (type === 'subscription_upgrade') {
        return this.handleUpgradePaymentConfirmation(paymentIntent)
      } else {
        return this.handleNewSubscriptionPaymentConfirmation(paymentIntent)
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

  /**
   * Handles confirmation of upgrade payment intents
   * @param paymentIntent - Stripe payment intent
   * @returns Upgrade confirmation result
   */
  private async handleUpgradePaymentConfirmation(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    const { planId, companyId, transactionId, currentSubscriptionId } =
      paymentIntent.metadata

    try {
      // Update Stripe subscription
      await this.stripe.subscriptions.update(currentSubscriptionId, {
        items: [
          {
            id: await this.getSubscriptionItemId(currentSubscriptionId),
            price: await this.getPlanPriceId(planId),
          },
        ],
        proration_behavior: 'create_prorations',
      })

      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'SUCCEEDED' },
      })

      // Update subscription in database
      await this.updateSubscriptionPlan(
        companyId,
        planId,
        currentSubscriptionId,
      )

      console.log(`Upgrade payment confirmed for company ${companyId}`)

      return {
        subscriptionId: currentSubscriptionId,
        transactionId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    } catch (error) {
      console.error('Error confirming upgrade payment:', error)
      throw new PaymentError(
        'Failed to confirm upgrade payment',
        'UPGRADE_CONFIRMATION_FAILED',
        false,
        500,
      )
    }
  }

  /**
   * Handles confirmation of new subscription payment intents
   * @param paymentIntent - Stripe payment intent
   * @returns New subscription confirmation result
   */
  private async handleNewSubscriptionPaymentConfirmation(
    paymentIntent: Stripe.PaymentIntent,
  ) {
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
        plan: { connect: { id: plan.id } },
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
  }

  /**
   * Gets plan price ID from Stripe
   * @param planId - Plan ID
   * @returns Stripe price ID
   */
  private async getPlanPriceId(planId: string): Promise<string> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: { stripePriceId: true },
    })

    if (!plan?.stripePriceId) {
      throw new Error(`Plan ${planId} does not have a Stripe price ID`)
    }

    return plan.stripePriceId
  }

  // Helper method to construct success or cancel URLs for checkout sessions
  private constructUrl(companyId: string, transactionUuid: string): string {
    return `${STRIPE.URL}?&companyId=${companyId}&transactionId=${transactionUuid}&sessionId={CHECKOUT_SESSION_ID}`
  }
}
