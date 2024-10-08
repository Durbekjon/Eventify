import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateSheetDto } from './dto/create-sheet.dto'
import { UpdateSheetDto } from './dto/update-sheet.dto'
@Injectable()
export class SheetRepository {
  constructor(private readonly prisma: PrismaService) {}
  createSheet(body: CreateSheetDto, companyId: string) {
    return this.prisma.sheet.create({
      data: {
        name: body.name,
        workspace: {
          connect: {
            id: body.workspaceId,
          },
        },
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    })
  }

  findById(id: string) {
    return this.prisma.sheet.findUnique({
      where: { id },
      include: { columns: true, tasks: true },
    })
  }

  getSheetsByWorkspace(workspaceId: string) {
    return this.prisma.sheet.findMany({
      where: { workspaceId },
      orderBy: {
        order: 'desc',
      },
    })
  }

  updateSheet(id: string, body: UpdateSheetDto) {
    return this.prisma.sheet.update({
      where: { id },
      data: {
        name: body.name,
        order: body.order,
      },
    })
  }
  deleteSheet(id: string) {
    return this.prisma.sheet.delete({ where: { id } })
  }

  deleteMultipleSheetsByWorkspace(workspaceId: string) {
    return this.prisma.sheet.deleteMany({ where: { workspaceId } })
  }
}
