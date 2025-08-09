import { PaymentError } from '@/modules/payment/payment.error'
import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { MemberTypes } from '@prisma/client'

@Injectable()
export class SubscriptionValidationService {
  constructor(private readonly prismaService: PrismaService) {}

  async validateSubscription(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: true,
      },
    })
    const lastSubscription =
      company.subscriptions[company.subscriptions.length - 1]
    if (!lastSubscription) {
      throw new PaymentError(
        'No active subscription found',
        'NO_ACTIVE_SUBSCRIPTION',
        false,
        403,
      )
    }
  }

  async validateSubscriptionToWorkspace(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: true,
      },
    })
    const lastSubscription =
      company.subscriptions[company.subscriptions.length - 1]
    if (!lastSubscription) {
      throw new PaymentError(
        'No active subscription found',
        'NO_ACTIVE_SUBSCRIPTION',
        false,
        403,
      )
    }
    const plan = await this.prismaService.plan.findUnique({
      where: { id: lastSubscription.planId },
    })
    const workspaces = await this.prismaService.workspace.count({
      where: { companyId },
    })
    if (!plan) {
      throw new PaymentError('Plan not found', 'PLAN_NOT_FOUND', false, 404)
    }
    if (plan.maxWorkspaces === -1) {
      return 
    }

    if (plan.maxWorkspaces <= workspaces) {
      throw new PaymentError(
        'Workspace limit reached',
        'WORKSPACE_LIMIT_REACHED',
        false,
        403,
      )
    }
    return
  }

  async validateSubscriptionToSheet(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: true,
      },
    })
    const lastSubscription =
      company.subscriptions[company.subscriptions.length - 1]
    if (!lastSubscription) {
      throw new PaymentError(
        'No active subscription found',
        'NO_ACTIVE_SUBSCRIPTION',
        false,
        403,
      )
    }
    const plan = await this.prismaService.plan.findUnique({
      where: { id: lastSubscription.planId },
    })
    const sheets = await this.prismaService.sheet.count({
      where: { companyId },
    })
    if (!plan) {
      throw new PaymentError('Plan not found', 'PLAN_NOT_FOUND', false, 404)
    }
    if (plan.maxSheets === -1) {
      return
    }
    if (plan.maxSheets <= sheets) {
      throw new PaymentError(
        'Sheet limit reached',
        'SHEET_LIMIT_REACHED',
        false,
        403,
      )
    }
    return
  }

  async validateSubscriptionToMember(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: true,
      },
    })
    const lastSubscription =
      company.subscriptions[company.subscriptions.length - 1]
    if (!lastSubscription) {
      throw new PaymentError(
        'No active subscription found',
        'NO_ACTIVE_SUBSCRIPTION',
        false,
        403,
      )
    }
    const plan = await this.prismaService.plan.findUnique({
      where: { id: lastSubscription.planId },
    })
    const members = await this.prismaService.member.count({
      where: { companyId },
    })
    if (!plan) {
      throw new PaymentError('Plan not found', 'PLAN_NOT_FOUND', false, 404)
    }
    if (plan.maxMembers === -1) {
      return
    }
    if (plan.maxMembers <= members) {
      throw new PaymentError(
        'Member limit reached',
        'MEMBER_LIMIT_REACHED',
        false,
        403,
      )
    }
  }

  async validateSubscriptionToViewer(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: true,
      },
    })
    const lastSubscription =
      company.subscriptions[company.subscriptions.length - 1]
    if (!lastSubscription) {
      throw new PaymentError(
        'No active subscription found',
        'NO_ACTIVE_SUBSCRIPTION',
        false,
        403,
      )
    }
    const plan = await this.prismaService.plan.findUnique({
      where: { id: lastSubscription.planId },
    })
    const viewers = await this.prismaService.member.count({
      where: { companyId, type: MemberTypes.VIEWER },
    })
    if (!plan) {
      throw new PaymentError('Plan not found', 'PLAN_NOT_FOUND', false, 404)
    }
    if (plan.maxViewers === -1) {
      return
    }
    if (plan.maxViewers <= viewers) {
      throw new PaymentError(
        'Viewer limit reached',
        'VIEWER_LIMIT_REACHED',
        false,
        403,
      )
    }
    return
  }

  async validateSubscriptionToTask(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: true,
      },
    })
    const lastSubscription =
      company.subscriptions[company.subscriptions.length - 1]
    if (!lastSubscription) {
      throw new PaymentError(
        'No active subscription found',
        'NO_ACTIVE_SUBSCRIPTION',
        false,
        403,
      )
    }
    const plan = await this.prismaService.plan.findUnique({
      where: { id: lastSubscription.planId },
    })
    const tasks = await this.prismaService.task.count({
      where: { companyId },
    })
    if (!plan) {
      throw new PaymentError('Plan not found', 'PLAN_NOT_FOUND', false, 404)
    }
    if (plan.maxTasks === -1) {
      return
    }
    if (plan.maxTasks <= tasks) {
      throw new PaymentError('Task limit reached', 'TASK_LIMIT_REACHED', false, 403)
    }
    return
  }
}
