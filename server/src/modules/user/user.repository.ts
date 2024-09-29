import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            company: true,
            access: {
              include: { workspaces: true },
            },
          },
        },
        members: true,
      },
    })
  }
}
