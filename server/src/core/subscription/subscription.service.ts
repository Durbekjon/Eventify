import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCompanySubscription(companyId: string) {
    
  }
}
