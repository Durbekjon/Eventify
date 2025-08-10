import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
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
    // Create the plan in the database
    const plan = await this.prisma.plan.create({
      data: {
        ...body,
        maxTasks: body.maxTasks ?? 0,
      },
    })

    // Create the corresponding product and price in Stripe
    await this.stripe.createProduct(plan)
    return plan // Return the created plan
  }

  async getPlans() {
    return this.prisma.plan.findMany({ orderBy: { order: 'asc' } })
  }

  async getPlan(id: string) {
    return this.prisma.plan.findUnique({ where: { id } })
  }

  async updatePlan(id: string, body: UpdatePlanDto) {
    const plan = await this.getPlan(id) // Fetch the current plan

    // Update the plan in the database
    const updatedPlan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...body,
        price: body.price ? body.price * 100 : plan.price, // Use existing price if not provided
        order: body.order ?? plan.order, // Handle the case where order might not be provided
      },
    })

    // Check if the price has changed and update in Stripe
    if (plan.price !== updatedPlan.price) {
      const prices = await this.stripe.pricesList({ product: id })
      const currentPrice = prices.data.find((price) => price.active)

      // Deactivate the current price if it exists
      if (currentPrice) {
        // First, create the new price
        const newPrice = await this.stripe.createPrice({
          product: id,
          currency: 'usd',
          unit_amount: updatedPlan.price * 100, // New price in cents
        })

        // Then, update the product to set the new price as the default
        await this.stripe.updateProduct(id, { default_price: newPrice.id })

        // Finally, deactivate the old price
        await this.stripe.pricesUpdate(currentPrice.id, { active: false })
      }
    }

    // Update the product details in Stripe
    await this.stripe.updateProduct(id, {
      name: updatedPlan.name,
      description: updatedPlan.description,
    })

    return updatedPlan // Return the updated plan
  }

  async deletePlan(id: string) {
    try {
      // Try to delete from Stripe first (this won't throw errors now)
      await this.stripe.deleteProduct(id)
    } catch (error) {
      // Log the error but continue with database deletion
      console.error(
        `Error deleting Stripe product for plan ${id}:`,
        error.message,
      )
    }

    // Always delete from database, regardless of Stripe deletion result
    return this.prisma.plan.delete({ where: { id } })
  }
}
