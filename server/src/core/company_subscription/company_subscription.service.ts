import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

@Injectable()
export class CompanySubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('1 0 * * *') // Har kuni yarim tun (00:01)
  async handleCron() {
    const currentDate = new Date() // Hozirgi vaqtni bir marta oling

    const expiredSubscriptions = await this.prisma.companySubscription.findMany(
      {
        where: {
          endDate: {
            lt: currentDate,
          },
          isExpired: false,
        },
      },
    )

    if (expiredSubscriptions.length > 0) {
      // Barcha yangilanishlarni bir vaqtda amalga oshirish
      await Promise.all(
        expiredSubscriptions.map(async (subscription) => {
          // Subscription va kompaniyani yangilang
          await this.prisma.companySubscription.update({
            where: { id: subscription.id },
            data: { isExpired: true },
          })
          await this.prisma.company.update({
            where: { id: subscription.companyId },
            data: { isBlocked: true, currentSubscriptionId: '' },
          })
        }),
      )
    }
  }
}
