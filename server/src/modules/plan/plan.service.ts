import { Injectable, NotFoundException } from '@nestjs/common'
import { PlanRepository } from './plan.repository'
import { CreatePlanDto } from './dto/create-plan.dto'
import { HTTP_MESSAGES } from '@/consts/http-messages'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { Plan } from '@prisma/client'

@Injectable()
export class PlanService {
  constructor(private readonly repository: PlanRepository) {}

  async createPlan(body: CreatePlanDto) {
    const plan = await this.repository.createPlan(body)
    const validatedPlan = await this.validatePlan(plan)
    return validatedPlan
  }

  async getPlans(userId: string | null) {
    if (userId) {
      const isAdmin = await this.repository.isUserAdmin(userId)
      if (isAdmin) {
        const plans = await this.repository.getPlansForAdmin()
        return this.validatePlans(plans)
      }
      const customizedPlans =
        await this.repository.getUserCustomizedPlans(userId)
      const validatedCustomizedPlans = await this.validatePlans(customizedPlans)
      const plans = await this.repository.getPlans()
      const validatedPlans = await this.validatePlans(plans)
      return [...validatedCustomizedPlans, ...validatedPlans]
    } else {
      const plans = await this.repository.getPlans()
      return this.validatePlans(plans)
    }
  }

  async getPlan(id: string) {
    const plan = await this.getById(id)
    return this.validatePlans([plan])[0]
  }

  async updatePlan(id: string, body: UpdatePlanDto) {
    const plan = await this.getById(id)
    const updatedPlan = await this.repository.updatePlan(plan.id, body)
    const validatedPlan = await this.validatePlan(updatedPlan)
    return validatedPlan
  }

  async deleletePlan(id: string) {
    const plan = await this.getById(id)
    return this.repository.deletePlan(plan.id)
  }

  private async getById(id: string) {
    const plan = await this.repository.getPlan(id)

    if (!plan) throw new NotFoundException(HTTP_MESSAGES.PLAN.NOT_FOUND)

    return plan
  }

  private async validatePlans(plans: Plan[]) {
    return plans.map((plan: Plan) => {
      return {
        ...plan, // avval plan qiymatlari
        maxWorkspaces:
          plan.maxWorkspaces < 0 ? 'unlimited' : plan.maxWorkspaces,
        maxMembers: plan.maxMembers < 0 ? 'unlimited' : plan.maxMembers,
        maxSheets: plan.maxSheets < 0 ? 'unlimited' : plan.maxSheets,
        maxTasks: plan.maxTasks < 0 ? 'unlimited' : plan.maxTasks,
        maxViewers: plan.maxViewers < 0 ? 'unlimited' : plan.maxViewers,
      }
    })
  }

  private async validatePlan(plan: Plan) {
    return {
      ...plan,
      stripePriceId: plan.stripePriceId,
      stripeProductId: plan.stripeProductId,
    }
  }
}
