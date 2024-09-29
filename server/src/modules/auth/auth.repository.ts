import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }
}
