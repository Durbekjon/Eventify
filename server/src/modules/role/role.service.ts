import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateRoleDto } from './dto/create-role.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(body: CreateRoleDto) {
    const data: Prisma.RoleCreateInput = {
      type: body.type,
      company: {
        connect: {
          id: body.company,
        },
      },
      user: {
        connect: {
          id: body.user,
        },
      },
    }

    if (body.access) data.access = { connect: { id: body.access } }
    const role = await this.prisma.role.create({
      data,
    })

    await this.prisma.user.update({
      where: { id: body.user },
      data: { selectedRole: role.id },
    })

    return role
  }

  deleteCompanyRoles(companyId: string) {
    return this.prisma.role.deleteMany({ where: { companyId } })
  }

  getUserSelectedRole(user: { roles: any[]; selectedRole: string }) {
    return user.roles.find((e) => e.id === user.selectedRole)
  }
}
