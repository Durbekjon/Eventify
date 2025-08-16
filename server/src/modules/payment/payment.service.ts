import { PrismaService } from '@core/prisma/prisma.service'
import { BadRequestException, Injectable } from '@nestjs/common'
import { StripeService } from '@stripe/stripe.service'
import { IUser } from '@user/dto/IUser'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { PaymentRepository } from './payment.repository'
import { RoleTypes, User } from '@prisma/client'
import { RoleDto } from '@role/dto/role.dto'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import Stripe from 'stripe'
import { PaymentError } from './payment.error'
import { randomUUID } from 'crypto'

@Injectable()
export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Creates a payment intent for inline/embedded payment processing
   * @param user - The authenticated user
   * @param body - Payment creation data
   * @returns Payment intent with client secret for frontend integration
   */
  async createInlinePayment(user: IUser, body: CreatePaymentDto) {
    try {
      // 1. Validate user and role
      const { user: validatedUser, role } = await this.validateUserRole(user)

      // 2. Validate plan exists
      const plan = await this.validatePlan(body.planId)

      // 3. Check for existing active subscription
      const existingSubscription = await this.getActiveSubscription(
        role.companyId,
      )

      // 4. If subscription exists, check if it's an upgrade
      if (existingSubscription) {
        // Check if this is an upgrade to a different plan
        if (existingSubscription.planId === body.planId) {
          throw PaymentError.activeSubscriptionExists()
        }

        // This is an upgrade - create upgrade payment intent
        return await this.createUpgradePaymentIntent(
          validatedUser,
          role.companyId,
          existingSubscription,
          plan,
        )
      }

      // 5. Create or get Stripe customer
      const customer = await this.getOrCreateCustomer(
        validatedUser,
        role.companyId,
      )

      // 6. Create payment intent for new subscription
      return await this.stripeService.createPaymentIntent(
        plan,
        validatedUser.id,
        role.companyId,
        customer.id,
      )
    } catch (error) {
      if (error instanceof PaymentError) {
        throw error
      }
      console.error('Error creating payment intent:', error.message)
      throw PaymentError.paymentProcessingFailed(error.message)
    }
  }

  /**
   * Confirms a payment intent and creates the subscription
   * @param paymentIntentId - The Stripe payment intent ID
   * @returns Confirmation status with subscription details
   */
  async confirmInlinePayment(paymentIntentId: string) {
    try {
      const result =
        await this.stripeService.confirmPaymentIntent(paymentIntentId)
      return {
        status: 'SUCCESS',
        message: 'Payment confirmed successfully',
        details: {
          subscriptionId: result.subscriptionId,
          transactionId: result.transactionId,
          amount: result.amount,
          currency: result.currency,
        },
      }
    } catch (error) {
      console.error('Error confirming payment intent:', error.message)
      throw PaymentError.paymentProcessingFailed(error.message)
    }
  }

  /**
   * Creates a payment intent specifically for subscription upgrades
   * @param user - The authenticated user
   * @param companyId - Company ID
   * @param currentSubscription - Current active subscription
   * @param newPlan - New plan to upgrade to
   * @returns Payment intent with client secret for upgrade
   */
  private async createUpgradePaymentIntent(
    user: User,
    companyId: string,
    currentSubscription: any,
    newPlan: any,
  ) {
    try {
      // Calculate proration amount
      const prorationAmount = this.calculateProrationAmount(
        currentSubscription,
        newPlan,
      )

      // If proration is negative (downgrade), no additional payment needed
      if (prorationAmount <= 0) {
        return this.processUpgradeWithoutPayment(
          user,
          companyId,
          currentSubscription,
          newPlan,
        )
      }

      // Get or create customer for the company
      const customer = await this.getOrCreateCustomer(user, companyId)

      // Check if current subscription has Stripe ID
      if (!currentSubscription.stripeSubscriptionId) {
        // If no Stripe subscription exists, treat this as a new subscription
        return await this.stripeService.createPaymentIntent(
          newPlan,
          user.id,
          companyId,
          customer.id,
        )
      }

      // Create payment intent for the proration amount
      return await this.stripeService.createUpgradePaymentIntent(
        newPlan,
        user.id,
        companyId,
        customer.id,
        currentSubscription.stripeSubscriptionId,
        prorationAmount,
      )
    } catch (error) {
      console.error('Error creating upgrade payment intent:', error.message)
      throw PaymentError.paymentProcessingFailed(error.message)
    }
  }

  /**
   * Processes upgrade without additional payment (downgrades or same price)
   * @param user - User data
   * @param companyId - Company ID
   * @param currentSubscription - Current subscription
   * @param newPlan - New plan
   * @returns Upgrade result
   */
  private async processUpgradeWithoutPayment(
    user: User,
    companyId: string,
    currentSubscription: any,
    newPlan: any,
  ) {
    try {
      const transactionUuid = randomUUID()

      // If subscription has Stripe ID, update it
      if (currentSubscription.stripeSubscriptionId) {
        await this.stripeService.updateSubscription(
          currentSubscription.stripeSubscriptionId,
          {
            items: [
              {
                id: currentSubscription.stripeItemId || '',
                price: newPlan.stripePriceId || '',
              },
            ],
            proration_behavior: 'none',
          },
        )
      }

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          id: transactionUuid,
          userId: user.id,
          companyId,
          planId: newPlan.id,
          amount: 0,
          currency: 'usd',
          status: 'SUCCEEDED',
        },
      })

      // Update subscription in database
      await this.updateSubscriptionPlan(
        companyId,
        newPlan.id,
        currentSubscription.stripeSubscriptionId,
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
   * Updates subscription plan in database
   * @param companyId - Company ID
   * @param newPlanId - New plan ID
   * @param stripeSubscriptionId - Stripe subscription ID (optional)
   */
  private async updateSubscriptionPlan(
    companyId: string,
    newPlanId: string,
    stripeSubscriptionId?: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      // Update company subscription
      if (stripeSubscriptionId) {
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
      } else {
        // Update subscription without Stripe ID
        await tx.companySubscription.updateMany({
          where: {
            companyId,
            isExpired: false,
          },
          data: {
            planId: newPlanId,
            updatedAt: new Date(),
          },
        })
      }

      // Update company plan reference
      await tx.company.update({
        where: { id: companyId },
        data: { planId: newPlanId },
      })
    })
  }

  /**
   * Calculates proration amount for subscription upgrade
   * @param currentSubscription - Current subscription
   * @param newPlan - New plan
   * @returns Proration amount in cents
   */
  private calculateProrationAmount(
    currentSubscription: any,
    newPlan: any,
  ): number {
    const now = new Date()
    const endDate = new Date(currentSubscription.endDate)
    const remainingDays = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    const totalDays = 30 // Assuming monthly billing

    const currentPrice = currentSubscription.plan.price
    const newPrice = newPlan.price
    const priceDifference = newPrice - currentPrice

    // Calculate proration based on remaining time
    const prorationAmount = Math.round(
      (priceDifference * remainingDays) / totalDays,
    )

    // If downgrading, proration might be negative (credit)
    // If upgrading, proration will be positive (additional charge)
    return prorationAmount
  }

  /**
   * Validates user role, ensuring it exists and is an AUTHOR
   * @param user - The user to validate
   * @returns Validated user and role
   */
  private async validateUserRole(
    user: IUser,
  ): Promise<{ user: User; role: RoleDto }> {
    const currentUser = await this.userService.getUser(user.id)

    const selectedRole = this.roleService.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR) {
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)
    }

    return { user: currentUser, role: selectedRole }
  }

  /**
   * Handle webhook events from Stripe
   * @param event - Stripe webhook event
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    await this.stripeService.handleWebhookEvent(event)
  }

  /**
   * Validate plan exists and is active
   * @param planId - Plan ID to validate
   * @returns Validated plan
   */
  private async validatePlan(planId: string) {
    const plan = await this.repository.getPlan(planId)
    if (!plan) {
      throw PaymentError.planNotFound()
    }
    return plan
  }

  /**
   * Get active subscription for company
   * @param companyId - Company ID
   * @returns Active subscription if exists
   */
  private async getActiveSubscription(companyId: string) {
    return this.prisma.companySubscription.findFirst({
      where: {
        companyId,
        isExpired: false,
        endDate: { gt: new Date() },
      },
      include: {
        plan: true,
      },
    })
  }

  /**
   * Get or create Stripe customer for the company
   * @param user - User data
   * @param companyId - Company ID
   * @returns Stripe customer
   */
  private async getOrCreateCustomer(user: User, companyId: string) {
    // Check if company already has a Stripe customer
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { stripeCustomerId: true },
    })

    if (company?.stripeCustomerId) {
      return { id: company.stripeCustomerId }
    }

    // Create new customer
    const customer = await this.stripeService.createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { companyId },
    })

    // Update company with customer ID
    await this.prisma.company.update({
      where: { id: companyId },
      data: { stripeCustomerId: customer.id },
    })

    return customer
  }
}
