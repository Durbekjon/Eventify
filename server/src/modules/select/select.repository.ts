import { PrismaService } from '@core/prisma/prisma.service'
import { Injectable } from '@nestjs/common'
import { CreateSelectDto } from './dto/create-select.dto'
import { UpdateSelectDto } from './dto/update-select.dto'
import { UUID } from 'crypto'
import { OptionRepository } from '@option/option.repository'

@Injectable()
export class SelectRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly option: OptionRepository,
  ) {}
  createSelect(body: CreateSelectDto, companyId: string) {
    return this.prisma.select.create({
      data: {
        title: body.title,
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
        title: body.title,
        color: body.color,
      },
    })
  }

  findManyByIds(id: [UUID]) {
    return this.prisma.select.findMany({
      where: {
        id: { in: id },
      },
      include: {
        options: true,
      },
    })
  }

  getSelects(companyId: string) {
    return this.prisma.select.findMany({
      where: { companyId },
      include: {
        options: true,
      },
      orderBy: { id: 'desc' },
    })
  }

  getSelect(id: string) {
    return this.prisma.select.findUnique({
      where: { id },
      include: {
        options: true,
      },
    })
  }

  async deleteSelect(id: string) {
    await this.option.deleteMany(id)
    return this.prisma.select.delete({ where: { id } })
  }

  async deleteSelects(id: UUID[]) {
    const deleteOptionsPromise = id.map((selectId: string) =>
      this.option.deleteMany(selectId),
    )

    await Promise.all(deleteOptionsPromise)

    return this.prisma.select.deleteMany({
      where: {
        id: {
          in: id,
        },
      },
    })
  }
}
