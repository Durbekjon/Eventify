import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CompanySubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('1 0 * * *')
  async handleCron() {
    const expiredSubscriptions = await this.prisma.companySubscription.findMany(
      {
        where: {
          endDate: {
            lt: new Date(),
          },
          isExpired: false,
        },
      },
    )

    expiredSubscriptions.forEach(async (subscription) => {
      await this.prisma.companySubscription.update({
        where: { id: subscription.id },
        data: { isExpired: true },
      })
      await this.prisma.company.update({
        where: { id: subscription.companyId },
        data: { isBlocked: true, currentSubscriptionId: '' },
      })
    })
  }
}
