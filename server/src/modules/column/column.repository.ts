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
              selects: {
                create:
                  column.selects?.map((select) => ({
                    title: select.title,
                    color: select.color,
                  })) || [],
              },
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
    const column = await this.prisma.column.create({
      data: {
        name: body.name,
        show: body.show,
        type: body.type,
        key,
        selected: body.selected?.trim() ?? null,
        sheet: { connect: { id: body.sheetId } },
        company: { connect: { id: companyId } },
      },
    })
    if (body.selects && body.selects.length > 0) {
      await Promise.all(
        body.selects.map(async (select) => {
         return this.prisma.select.create({
            data: {
              title: select.title,
              color: select.color,
              column: { connect: { id: column.id } },
              company: { connect: { id: companyId } },
              options: {
                create:
                  select.options.map((option) => ({
                    name: option.name,
                    color: option.color,
                  })) || [],
              },
            },
            include: {
              options: true
            }
          })
        }),
      )
    }

    return this.findById(column.id)
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
      include: {
        selects: { include: { options: true } },
      },
    })
  }

  async deleteColumn(id: string): Promise<Column> {
    return this.prisma.column.delete({ where: { id } })
  }

  async getSheetById(sheetId: string, companyId: string): Promise<boolean> {
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: sheetId, companyId },
    })
    return !!sheet
  }

  getColumnsBySheetId(sheetId: string): Promise<Column[]> {
    return this.prisma.column.findMany({ where: { sheetId } })
  }
}
