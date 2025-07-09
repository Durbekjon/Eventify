import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateMemberDto } from './dto/create-member.dto'
import { StatusUpdateDto } from './dto/status-update.dto'
import { UpdateMemberDto } from './dto/update-member.dto'
import { Prisma } from '@prisma/client'

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

  getActiveMembersInReverseOrder(companyId: string) {
    // status: { not: 'NEW' }
    return this.prisma.member.findMany({
      where: { companyId, status: { not: 'CANCELLED' } },
      orderBy: { id: 'desc' },
      include: {
        user: {
          select: {
            email: true,
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
    return this.prisma.member.update({
      where: { id: memberId },
      data: { status: 'CANCELLED' },
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
