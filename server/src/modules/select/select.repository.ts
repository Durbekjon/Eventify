import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateSelectDto } from './dto/create-select.dto'
import { UpdateSelectDto } from './dto/update-select.dto'
import { UUID } from 'crypto'

@Injectable()
export class SelectRepository {
  constructor(private readonly prisma: PrismaService) {}
  createSelect(body: CreateSelectDto, companyId: string) {
    return this.prisma.select.create({
      data: {
        value: body.value,
        color: body.color,
        company: {
          connect: {
            id: companyId,
          },
        },
      },
    })
  }

  updateSelect(id: string, body: UpdateSelectDto) {
    return this.prisma.select.update({
      where: { id },
      data: {
        value: body.value,
        color: body.color,
      },
    })
  }

  findManyByIds(id: [UUID]) {
    return this.prisma.select.findMany({ where: { id: { in: id } } })
  }

  getSelects(companyId: string) {
    return this.prisma.select.findMany({
      where: { companyId },
      orderBy: { id: 'desc' },
    })
  }

  getSelect(id: string) {
    return this.prisma.select.findUnique({ where: { id } })
  }

  deleteSelect(id: string) {
    return this.prisma.select.delete({ where: { id } })
  }

  deleteSelects(id: UUID[]) {
    return this.prisma.select.deleteMany({
      where: {
        id: {
          in: id,
        },
      },
    })
  }
}
