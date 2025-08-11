import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get plan by ID
   * @param id - Plan ID
   * @returns Plan or null if not found
   */
  async getPlan(id: string) {
    return this.prisma.plan.findUnique({ where: { id } })
  }
}
