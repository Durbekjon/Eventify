import { Injectable } from '@nestjs/common'
import Stripe from 'stripe'
import { STRIPE } from '@consts/stripe'
import { Plan } from '@prisma/client'
import { randomUUID } from 'crypto'
import { PrismaService } from '@core/prisma/prisma.service'

@Injectable()
export class StripeService {
  private stripe: Stripe

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(
      'sk_test_51Q1Q38CNk2DfIGoIys6U9hiV9p3qwjb4TuZvIe5tpAaMjIM3mTRO9o02pjT5pSnPK39tnIL6JMF1s7DthagTAzvI00QSYDKOb0',
      {
        apiVersion: '2025-02-24.acacia',
      },
    )
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
      const prices = await this.stripe.prices.list({ product: planId })
      await Promise.all(
        prices.data.map((price) =>
          this.stripe.prices.update(price.id, { active: false }),
        ),
      )
      await this.stripe.products.del(planId)
    } catch (error) {
      throw new Error(`Unable to delete product: ${error.message}`)
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
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)
    return session.payment_status
  }

  // Handles Stripe webhooks, particularly focusing on completed checkout sessions
  async handleWebhook(payload: any): Promise<{
    session: Stripe.Checkout.Session
    planId: string
    userId: string
  } | null> {
    const event = payload

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const { planId, userId } = session.metadata
      return { session, planId, userId }
    }

    return null
  }

  // Helper method to construct success or cancel URLs for checkout sessions
  private constructUrl(companyId: string, transactionUuid: string): string {
    return `${STRIPE.URL}?&companyId=${companyId}&transactionId=${transactionUuid}&sessionId={CHECKOUT_SESSION_ID}`
  }
}
