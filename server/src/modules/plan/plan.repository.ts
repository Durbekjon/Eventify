import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'

@Injectable()
export class PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPlan(body: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        maxWorkspaces: body.maxWorkspaces,
        maxSheets: body.maxSheets,
        maxMembers: body.maxMembers,
        maxViewers: body.maxViewers,
      },
    })
  }
  getPlans() {
    return this.prisma.plan.findMany({ orderBy: { order: 'asc' } })
  }

  getPlan(id: string) {
    return this.prisma.plan.findUnique({ where: { id } })
  }

  updatePlan(id: string, body: UpdatePlanDto) {
    return this.prisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        maxWorkspaces: body.maxWorkspaces,
        maxSheets: body.maxSheets,
        maxMembers: body.maxMembers,
        maxViewers: body.maxViewers,
        order: body.order ?? null,
      },
    })
  }

  deletePlan(id: string) {
    return this.prisma.plan.delete({ where: { id } })
  }
}
