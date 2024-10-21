import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  getPlan(id: string) {
    return this.prisma.plan.findUnique({ where: { id } })
  }

  getCompany(id: string) {
    return this.prisma.company.findUnique({ where: { id } })
  }
}
