import { PrismaService } from '@core/prisma/prisma.service'
import { BadRequestException, Injectable } from '@nestjs/common'
import { StripeService } from '@stripe/stripe.service'
import { IUser } from '@user/dto/IUser'
import { CreatePaymentDto } from './dto/create-payment.dto'
import { PaymentRepository } from './payment.repository'
import { RoleTypes, TransactionStatus, User } from '@prisma/client'
import { RoleDto } from '@role/dto/role.dto'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import Stripe from 'stripe'
import { PaymentError } from './payment.error'

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
      const existingSubscription = await this.getActiveSubscription(role.companyId)
      if (existingSubscription) {
        throw PaymentError.activeSubscriptionExists()
      }

      // 4. Create or get Stripe customer
      const customer = await this.getOrCreateCustomer(validatedUser, role.companyId)

      // 5. Create payment intent
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
   * @returns Confirmation status
   */
  async confirmInlinePayment(paymentIntentId: string) {
    try {
      await this.stripeService.confirmPaymentIntent(paymentIntentId)
      return {
        status: 'SUCCESS',
        message: 'Payment confirmed successfully',
      }
    } catch (error) {
      console.error('Error confirming payment intent:', error.message)
      throw PaymentError.paymentProcessingFailed(error.message)
    }
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
