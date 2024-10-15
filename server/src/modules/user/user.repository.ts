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
      include: {
        roles: {
          include: {
            company: true,
            access: true,
          },
        },
      },
    })

    delete user.password

    const roles = user.roles.map((role) => {
      return {
        id: role.id,
        type: role.type,
        company: { id: role.companyId, name: role.company.name },
        member: role?.access,
        createdAt: role.createdAt,
      }
    })
    return { ...user, roles }
  }

  getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })
  }

  changeRole(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { selectedRole: roleId },
    })
  }
}
