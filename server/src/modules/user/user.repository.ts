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
        avatar: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    })
  }

  async getUserInfo(iUser: IUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: iUser.id },
      include: {
        roles: {
          include: {
            company: {
              include: {
                plan: true,
              },
            },
            access: true,
          },
        },
        avatar: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    })

    delete user.password

    const roles = user.roles.map((role) => {
      return {
        id: role.id,
        type: role.type,
        company: {
          id: role.companyId,
          name: role.company.name,
          plan: role.company.plan,
        },
        member: role?.access,
        createdAt: role.createdAt,
      }
    })
    return { ...user, roles }
  }

  getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        avatar: { select: { id: true, path: true } },
      },
    })
  }

  changeRole(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { selectedRole: roleId },
    })
  }

  async changeAvatar(userId: string, avatarId: string) {
    const { password, ...user } = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: { connect: { id: avatarId } } },
      include: { avatar: true },
    })
    return user
  }

  async createAvatarFile(fileData: {
    filename: string
    originalName: string
    mimeType: string
    size: number
    path: string
    uploadedBy: string
  }) {
    return this.prisma.file.create({
      data: fileData,
    })
  }

  async updateFileAvatar(userId: string, fileId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: { connect: { id: fileId } } },
    })
  }
}
