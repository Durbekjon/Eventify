import { PrismaService } from '@/core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateWorkspaceDto } from './dto/create-workspace.dto'
import { UpdateWorkspaceDto } from './dto/update-workspace.dto'
@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWorkspace(body: CreateWorkspaceDto, companyId: string) {
    return this.prisma.workspace.create({
      data: { name: body.name, company: { connect: { id: companyId } } },
    })
  }

  updateWorkspace(id: string, body: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id },
      data: { name: body.name, order: body.order },
    })
  }

  getWorkspaces(companyId: string) {
    return this.prisma.workspace.findMany({
      where: {
        companyId,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        sheets: true,
        members: true,
      },
    })
  }

  deleteWorkspace(id: string) {
    return this.prisma.workspace.delete({ where: { id }, select: { id: true } })
  }
  findById(id: string) {
    return this.prisma.workspace.findUnique({
      where: { id },
      include: {
        sheets: true,
        members: true,
      },
    })
  }
  getOwnMemberWorkspaces(memberId: string) {
    return this.prisma.workspace.findMany({
      where: { members: { some: { id: memberId } } },
      include: { sheets: true },
    })
  }
}
