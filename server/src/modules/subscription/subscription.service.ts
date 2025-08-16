import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '@core/prisma/prisma.service'
import { StripeService } from '@core/stripe/stripe.service'
import { IUser } from '@user/dto/IUser'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { MemberTypes, RoleTypes } from '@prisma/client'

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  // Get active subscription for a company
  async getActiveSubscription(companyId: string) {
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

  // Upgrade subscription to a new plan
  async upgradeSubscription(user: IUser, newPlanId: string) {
    const { user: currentUser, role } = await this.validateUserRole(user)
    const currentSubscription = await this.getActiveSubscription(role.companyId)
    const newPlan = await this.getPlan(newPlanId)

    if (!currentSubscription) {
      throw new BadRequestException('No active subscription found')
    }

    if (currentSubscription.planId === newPlanId) {
      throw new BadRequestException('Subscription is already on this plan')
    }

    try {
      // Use the payment service for upgrade processing
      const upgradeResult = await this.processUpgrade(
        currentUser,
        role.companyId,
        currentSubscription,
        newPlan,
      )

      return {
        message: 'Subscription upgrade initiated successfully',
        upgradeDetails: upgradeResult,
      }
    } catch (error) {
      console.error('Subscription upgrade error:', error)
      throw new BadRequestException(
        `Failed to upgrade subscription: ${error.message}`,
      )
    }
  }

  // Cancel subscription
  async cancelSubscription(user: IUser, immediate: boolean = false) {
    const { role } = await this.validateUserRole(user)
    const subscription = await this.getActiveSubscription(role.companyId)

    if (!subscription) {
      throw new BadRequestException('No active subscription found')
    }

    try {
      if (immediate) {
        await this.stripeService.cancelSubscription(
          subscription.stripeSubscriptionId,
        )
        await this.updateSubscriptionStatus(role.companyId, 'CANCELLED')
      } else {
        await this.stripeService.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          },
        )
        await this.updateSubscriptionStatus(role.companyId, 'CANCELLING')
      }

      return { message: 'Subscription cancelled successfully' }
    } catch (error) {
      console.error('Subscription cancellation error:', error)
      throw new BadRequestException('Failed to cancel subscription')
    }
  }

  // Renew subscription
  async renewSubscription(subscriptionId: string) {
    const subscription = await this.getSubscription(subscriptionId)

    if (subscription.status === 'ACTIVE' || subscription.status === 'active') {
      await this.extendSubscription(subscriptionId)
      await this.notifyRenewal(subscription.companyId)
      return { message: 'Subscription renewed successfully' }
    }

    throw new BadRequestException('Subscription is not active')
  }

  // Get usage report for a company
  async getUsageReport(user: IUser) {
    const { role } = await this.validateUserRole(user)
    const subscription = await this.getActiveSubscription(role.companyId)
    const plan = subscription?.plan

    if (!subscription || !plan) {
      throw new NotFoundException('No active subscription found')
    }

    const currentUsage = await this.getCurrentUsage(role.companyId)
    const limits = this.getPlanLimits(plan)
    const remaining = this.calculateRemaining(currentUsage, limits)

    return {
      currentUsage,
      limits,
      remaining,
      subscription: {
        id: subscription.id,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        isExpired: subscription.isExpired,
      },
    }
  }

  // Create trial subscription
  async createTrialSubscription(
    user: IUser,
    planId: string,
    trialDays: number = 14,
  ) {
    const { user: currentUser, role } = await this.validateUserRole(user)
    const plan = await this.getPlan(planId)
    const existingSubscription = await this.getActiveSubscription(
      role.companyId,
    )

    if (existingSubscription) {
      throw new BadRequestException('Active subscription already exists')
    }

    try {
      const customer = await this.getOrCreateCustomer(
        currentUser,
        role.companyId,
      )

      // Create trial subscription in Stripe
      const trialSubscription = await this.stripeService.createSubscription({
        customerId: customer.id,
        priceId: plan.stripePriceId || '',
        trialDays,
        metadata: { companyId: role.companyId, planId },
      })

      // Create trial subscription in database
      await this.prisma.companySubscription.create({
        data: {
          companyId: role.companyId,
          planId,
          startDate: new Date(),
          endDate: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
          stripeSubscriptionId: trialSubscription.id,
          isExpired: false,
          requestsCount: 0,
        },
      })

      return { message: 'Trial subscription created successfully' }
    } catch (error) {
      console.error('Trial subscription creation error:', error)
      throw new BadRequestException('Failed to create trial subscription')
    }
  }

  // Private helper methods
  private async validateUserRole(user: IUser) {
    const currentUser = await this.userService.getUser(user.id)
    const selectedRole = this.roleService.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR) {
      throw new BadRequestException(
        'Only company authors can manage subscriptions',
      )
    }

    return { user: currentUser, role: selectedRole }
  }

  private async getPlan(planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      throw new NotFoundException('Plan not found')
    }
    return plan
  }

  private async getSubscription(subscriptionId: string) {
    const subscription = await this.prisma.companySubscription.findUnique({
      where: { id: subscriptionId },
    })
    if (!subscription) {
      throw new NotFoundException('Subscription not found')
    }
    return subscription
  }

  private calculateProration(currentSubscription: any, newPlan: any): number {
    // Calculate proration based on remaining time and price difference
    const now = new Date()
    const endDate = new Date(currentSubscription.endDate)
    const remainingDays = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    const totalDays = 30 // Assuming monthly billing

    const currentPrice = currentSubscription.plan.price
    const newPrice = newPlan.price
    const priceDifference = newPrice - currentPrice

    return Math.round((priceDifference * remainingDays) / totalDays)
  }

  private async updateSubscription(
    companyId: string,
    planId: string,
    stripeSubscription: any,
  ) {
    await this.prisma.companySubscription.updateMany({
      where: { companyId, isExpired: false },
      data: {
        planId,
        endDate: new Date(stripeSubscription.current_period_end * 1000),
        stripeSubscriptionId: stripeSubscription.id,
      },
    })

    await this.prisma.company.update({
      where: { id: companyId },
      data: { planId },
    })
  }

  private async updateSubscriptionStatus(companyId: string, status: string) {
    await this.prisma.companySubscription.updateMany({
      where: { companyId, isExpired: false },
      data: { isExpired: status === 'CANCELLED' },
    })

    if (status === 'CANCELLED') {
      await this.prisma.company.update({
        where: { id: companyId },
        data: { isBlocked: true },
      })
    }
  }

  private async extendSubscription(subscriptionId: string) {
    const subscription = await this.getSubscription(subscriptionId)
    const newEndDate = new Date(subscription.endDate)
    newEndDate.setMonth(newEndDate.getMonth() + 1)

    await this.prisma.companySubscription.update({
      where: { id: subscriptionId },
      data: { endDate: newEndDate },
    })
  }

  private async notifyRenewal(companyId: string) {
    // Implement notification logic here
    console.log(`Subscription renewed for company: ${companyId}`)
  }

  private async getOrCreateCustomer(user: any, companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { stripeCustomerId: true },
    })

    if (company?.stripeCustomerId) {
      return { id: company.stripeCustomerId }
    }

    const customer = await this.stripeService.createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { companyId },
    })

    await this.prisma.company.update({
      where: { id: companyId },
      data: { stripeCustomerId: customer.id },
    })

    return customer
  }

  private async getCurrentUsage(companyId: string) {
    // Use a single transaction to perform all queries efficiently
    const [company, counts] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true }, // Only select what we need
      }),
      this.prisma.$transaction([
        this.prisma.workspace.count({
          where: { companyId },
        }),
        this.prisma.sheet.count({
          where: { companyId },
        }),
        this.prisma.member.count({
          where: { companyId, type: MemberTypes.MEMBER },
        }),
        this.prisma.member.count({
          where: { companyId, type: MemberTypes.VIEWER },
        }),
        this.prisma.task.count({
          where: { companyId },
        }),
      ]),
    ])

    if (!company) {
      throw new NotFoundException('Company not found')
    }

    const [workspaces, sheets, members, viewers, tasks] = counts

    return {
      workspaces,
      sheets,
      members,
      viewers,
      tasks,
    }
  }

  private getPlanLimits(plan: any) {
    return {
      maxWorkspaces: plan.maxWorkspaces,
      maxSheets: plan.maxSheets,
      maxMembers: plan.maxMembers,
      maxRequests: plan.maxRequests,
    }
  }

  private calculateRemaining(currentUsage: any, limits: any) {
    return {
      workspaces: Math.max(0, limits.maxWorkspaces - currentUsage.workspaces),
      sheets: Math.max(0, limits.maxSheets - currentUsage.sheets),
      members: Math.max(0, limits.maxMembers - currentUsage.members),
      requests: Math.max(0, limits.maxRequests - currentUsage.requests),
    }
  }

  /**
   * Processes subscription upgrade using payment service
   * @param user - Current user
   * @param companyId - Company ID
   * @param currentSubscription - Current subscription
   * @param newPlan - New plan
   * @returns Upgrade result
   */
  private async processUpgrade(
    user: any,
    companyId: string,
    currentSubscription: any,
    newPlan: any,
  ) {
    // Calculate proration
    const prorationAmount = this.calculateProration(
      currentSubscription,
      newPlan,
    )

    // If downgrading or same price, process immediately
    if (prorationAmount <= 0) {
      return await this.processImmediateUpgrade(
        companyId,
        currentSubscription,
        newPlan,
        prorationAmount,
      )
    }

    // If upgrading (higher price), return upgrade information
    return {
      type: 'upgrade_required',
      prorationAmount,
      currentPlan: currentSubscription.plan,
      newPlan,
      message:
        'Payment required for upgrade. Use payment endpoint to complete upgrade.',
    }
  }

  /**
   * Processes immediate upgrade without additional payment
   * @param companyId - Company ID
   * @param currentSubscription - Current subscription
   * @param newPlan - New plan
   * @param prorationAmount - Proration amount
   * @returns Upgrade result
   */
  private async processImmediateUpgrade(
    companyId: string,
    currentSubscription: any,
    newPlan: any,
    prorationAmount: number,
  ) {
    try {
      // Update Stripe subscription immediately
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

      // Update database
      await this.updateSubscription(companyId, newPlan.id, {
        id: currentSubscription.stripeSubscriptionId,
      })

      return {
        type: 'immediate_upgrade',
        prorationAmount,
        message:
          'Subscription upgraded successfully without additional payment',
      }
    } catch (error) {
      console.error('Immediate upgrade error:', error)
      throw new Error('Failed to process immediate upgrade')
    }
  }
}
