import { Injectable, NotFoundException } from '@nestjs/common'
import { PlanRepository } from './plan.repository'
import { CreatePlanDto } from './dto/create-plan.dto'
import { HTTP_MESSAGES } from '@/consts/http-messages'
import { UpdatePlanDto } from './dto/update-plan.dto'

@Injectable()
export class PlanService {
  constructor(private readonly repository: PlanRepository) {}

  createPlan(body: CreatePlanDto) {
    return this.repository.createPlan(body)
  }

  getPlans() {
    return this.repository.getPlans()
  }

  getPlan(id: string) {
    return this.getById(id)
  }

  async updatePlan(id: string, body: UpdatePlanDto) {
    const plan = await this.getById(id)
    return this.repository.updatePlan(plan.id, body)
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
}
