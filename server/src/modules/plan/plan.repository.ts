import { PrismaService } from '@core/prisma/prisma.service'
import { BadRequestException, Injectable } from '@nestjs/common'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'
import { StripeService } from '@stripe/stripe.service'

@Injectable()
export class PlanRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async createPlan(body: CreatePlanDto) {
    const { isCustomized, customizedPlanFor, ...rest } = body

    if (isCustomized) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: customizedPlanFor },
        },
      })

      if (users.length !== customizedPlanFor.length) {
        throw new BadRequestException('Some users not found')
      }
    }

    // Create the plan in the database
    const plan = await this.prisma.plan.create({
      data: {
        ...rest,
        maxTasks: rest.maxTasks ?? 0,
        isCustomized,
        customizedForUsers: {
          connect: customizedPlanFor.map((id) => ({ id })),
        },
      },
    })

    // Create the corresponding product and price in Stripe
    await Promise.all([
      this.stripe.createProduct(plan),
      this.prisma.plan.update({
        where: { id: plan.id },
        data: {
          stripePriceId: plan.id,
          stripeProductId: plan.id,
        },
      }),
    ])
    return plan // Return the created plan
  }

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isCustomized: false },
      orderBy: { order: 'asc' },
    })
  }
  async getPlansForAdmin() {
    return this.prisma.plan.findMany({
      orderBy: { order: 'asc' },
    })
  }

  async getPlan(id: string) {
    return this.prisma.plan.findUnique({ where: { id } })
  }

  async updatePlan(id: string, body: UpdatePlanDto) {
    const plan = await this.getPlan(id)
    const { isCustomized, customizedPlanFor = [], ...rest } = body

    // Prepare customization changes
    const customizationData = isCustomized
      ? {
          isCustomized: true,
          customizedForUsers: {
            set: (
              await this.prisma.user.findMany({
                where: { id: { in: customizedPlanFor } },
                select: { id: true },
              })
            ).map(({ id }) => ({ id })),
          },
        }
      : {
          isCustomized: false,
          customizedForUsers: {
            disconnect: customizedPlanFor.map((uid) => ({ id: uid })),
          },
        }

    // Update plan in DB (single transaction step)
    const updatedPlan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...rest,
        ...customizationData,
        price: body.price ?? plan.price,
        order: body.order ?? plan.order,
      },
    })

    // If price has not changed, skip price update
    if (plan.price !== updatedPlan.price) {
      const prices = await this.stripe.pricesList({
        product: updatedPlan.stripeProductId,
      })
      const currentPrice = prices.data.find((p) => p.active)

      if (currentPrice) {
        const newPrice = await this.stripe.createPrice({
          product: updatedPlan.stripeProductId,
          currency: 'usd',
          unit_amount: updatedPlan.price * 100,
        })

        await this.stripe.updateProduct(updatedPlan.stripeProductId, {
          default_price: newPrice.id,
        })

        await this.stripe.pricesUpdate(currentPrice.id, { active: false })
      }
    }

    // Always sync product details in Stripe
    await this.stripe.updateProduct(updatedPlan.stripeProductId, {
      name: updatedPlan.name,
      description: updatedPlan.description,
    })

    return updatedPlan
  }

  async deletePlan(id: string) {
    const plan = await this.getPlan(id)
    try {
      // Try to delete from Stripe first (this won't throw errors now)
      await this.stripe.deleteProduct(plan.stripeProductId)
    } catch (error) {
      // Log the error but continue with database deletion
      console.error(
        `Error deleting Stripe product for plan ${plan.stripeProductId}:`,
        error.message,
      )
    }

    // Always delete from database, regardless of Stripe deletion result
    return this.prisma.plan.delete({ where: { id } })
  }
  getUserCustomizedPlans(userId: string) {
    return this.prisma.plan.findMany({
      where: {
        isCustomized: true,
        customizedForUsers: { some: { id: userId } },
      },
    })
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    return user.isAdmin
  }
}
