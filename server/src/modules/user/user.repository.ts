import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { IUser } from './dto/IUser'
import { UpdateUserDto } from './dto/update-user.dto'
import { Prisma } from '@prisma/client'
const userInclude = {
  roles: {
    include: {
      company: {
        include: {
          plan: true,
        },
      },
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
}
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    })
  }

  async createUser(email: string, password: string): Promise<IUser> {
    const user = await this.prisma.user.create({
      data: {
        email,
        password,
      },
      include: userInclude,
    })
    delete user.password
    return user
  }

  async getUserInfo(iUser: IUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: iUser.id },
      include: userInclude,
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
        firstName: true,
        lastName: true,
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

  async updateUser(userId: string, body: UpdateUserDto) {
    const { firstName, lastName } = body
    const data: Prisma.UserUpdateInput = {}
    if (firstName) data.firstName = firstName
    if (lastName) data.lastName = lastName

    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: userInclude,
    })
  }

  async changePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      include: userInclude,
    })
  }
}
