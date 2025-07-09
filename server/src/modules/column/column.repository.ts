import { Injectable } from '@nestjs/common'
import { PrismaService } from '@core/prisma/prisma.service'
import { Column, Prisma } from '@prisma/client'
import { CreateColumnDto } from './dto/create-column.dto'
import { UpdateColumnDto } from './dto/update-column.dto'

@Injectable()
export class ColumnRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMultipleColumns(body: CreateColumnDto[], companyId: string) {
    try {
      // Run all column creation operations in a transaction
      return await this.prisma.$transaction(
        body.map((column) =>
          this.prisma.column.create({
            data: {
              sheet: { connect: { id: column.sheetId } },
              company: { connect: { id: companyId } },
              name: column.name,
              key: column.key,
              show: column.show,
              type: column.type,
              selected: column.selected?.trim() ?? null,
              selects: column.selects?.length
                ? { connect: column.selects.map((id) => ({ id })) }
                : undefined,
            },
          }),
        ),
      )
    } catch (error) {
      console.error('Error creating columns:', error)
      throw new Error('Failed to create columns')
    }
  }

  async createColumn(body: CreateColumnDto, key: string, companyId: string) {
    return this.prisma.column.create({
      data: {
        sheet: { connect: { id: body.sheetId } },
        company: { connect: { id: companyId } },
        name: body.name,
        key,
        show: body.show,
        type: body.type,
        selected: body.selected?.trim() ?? null,
        selects: body.selects?.length
          ? { connect: body.selects.map((id) => ({ id })) }
          : undefined,
      },
    })
  }

  async updateColumn(columnId: string, body: UpdateColumnDto): Promise<Column> {
    const data: Prisma.ColumnUpdateInput = {
      name: body.name,
      show: body.show,
      type: body.type,
    }

    return this.prisma.column.update({ where: { id: columnId }, data })
  }

  async findById(columnId: string): Promise<Column | null> {
    return this.prisma.column.findUnique({
      where: { id: columnId },
    })
  }

  async deleteColumn(id: string): Promise<Column> {
    return this.prisma.column.delete({ where: { id } })
  }

  getColumnsBySheetId(sheetId: string): Promise<Column[]> {
    return this.prisma.column.findMany({ where: { sheetId } })
  }
}
