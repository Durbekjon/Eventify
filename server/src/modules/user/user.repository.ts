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

  async getUserInfo(iUser: IUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: iUser.id },
      include: { roles: true },
    })

    delete user.password

    return user
  }

  changeRole(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { selectedRole: roleId },
    })
  }
}
