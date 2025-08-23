import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateMemberDto } from './dto/create-member.dto'
import { StatusUpdateDto } from './dto/status-update.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { Prisma } from '@prisma/client'
import { FilterDto } from './dto/filter.dto'

@Injectable()
export class MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMember(body: CreateMemberDto, companyId: string) {
    try {
      const data: Prisma.MemberCreateInput = {
        type: body.type,
        permissions: body.permissions,
        view: body.view,
        user: {
          connect: { id: body.userId },
        },
        company: {
          connect: { id: companyId },
        },
      }

      if (body.workspaces && body.workspaces.length > 0) {
        const wsids = body.workspaces.map((id) => ({ id }))

        data.workspaces = {
          connect: wsids,
        }
      }

      return this.prisma.member.create({ data })
    } catch (error) {
      console.log(error)
    }
  }

  async getInvitations(companyId: string) {
    return this.prisma.member.findMany({
      where: { companyId, status: { not: 'ACTIVE' } },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            avatar: {
              select: {
                id: true,
                path: true,
              },
            },
          },
        },
        notification: {
          select: {
            isRead: true,
          },
        },

        workspaces: true,
      },
    })
  }

  async getActiveMembersInReverseOrder(companyId: string, filter: FilterDto) {
    const { type, status, page, limit } = filter
    const where: Prisma.MemberWhereInput = {
      companyId,
      status: 'ACTIVE',
    }
    if (type) where.type = type
    if (status) where.status = status

    const skip = (page - 1) * limit

    const [members, count] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              avatar: {
                select: {
                  id: true,
                  path: true,
                },
              },
            },
          },
          notification: {
            select: {
              isRead: true,
            },
          },

          workspaces: true,
        },
      }),
      this.prisma.member.count({ where }),
    ])

    return { members, count }
  }

  getMember(memberId: string) {
    return this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { email: true } },
        company: { select: { name: true } },
        notification: { select: { isRead: true } },
      },
    })
  }

  cancelMember(memberId: string) {
    return this.prisma.member.delete({
      where: { id: memberId },
    })
  }

  statusMember(body: StatusUpdateDto, memberId: string) {
    return this.prisma.member.update({
      where: { id: memberId },
      data: { status: body.status },
    })
  }

  updateMember(memberId: string, body: UpdateMemberDto) {
    return this.prisma.member.update({
      where: { id: memberId },
      data: { type: body.type, permissions: body.permissions, view: body.view },
    })
  }

  deleteCompanyMembers(companyId: string) {
    return this.prisma.member.deleteMany({ where: { companyId } })
  }
}
