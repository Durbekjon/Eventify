import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { IUser } from './dto/IUser'

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

  getUserInfo(user: IUser) {
    return this.prisma.user.findUnique({ where: { id: user.id } })
  }
}
