import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

@Injectable()
export class LogRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LogCreateInput) {
    return this.prisma.log.create({ data })
  }

  getByCompany(companyId: string) {
    return this.prisma.log.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  }

  getByWorkspace(workspaceId: string) {
    return this.prisma.log.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    })
  }

  getBySheet(sheetId: string) {
    return this.prisma.log.findMany({
      where: { sheetId },
      orderBy: { createdAt: 'desc' },
    })
  }
  getByTask(taskId: string) {
    return this.prisma.log.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    })
  }

  getWorkspace(workspaceId: string) {
    return this.prisma.workspace.findUnique({ where: { id: workspaceId } })
  }

  async getSheet(sheetId: string) {
    return await this.prisma.sheet.findUnique({ where: { id: sheetId } })
  }
}
