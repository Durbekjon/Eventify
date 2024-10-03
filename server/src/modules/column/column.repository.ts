import { Injectable } from '@nestjs/common'
import { PrismaService } from '@core/prisma/prisma.service'
import { Column, Prisma } from '@prisma/client'
import { CreateColumnDto } from './dto/create-column.dto'
import { TaskService } from '@task/task.service'
import { UpdateColumnDto } from './dto/update-column.dto'

@Injectable()
export class ColumnRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly task: TaskService,
  ) {}

  async createColumn(
    body: CreateColumnDto,
    companyId: string,
  ): Promise<Column> {
    const key = await this.generateUniqueKey(body.key, companyId)
    const data: Prisma.ColumnCreateInput = {
      sheet: { connect: { id: body.sheetId } },
      company: { connect: { id: companyId } },
      name: body.name,
      key,
      show: body.show,
      type: body.type,
    }

    const column = await this.prisma.column.create({ data })
    await this.updateTasksAfterColumnCreation(
      body.sheetId,
      column.key,
      body.type,
    )

    return column
  }

  async updateColumn(columnId: string, body: UpdateColumnDto) {
    const data: Prisma.ColumnUpdateInput = {
      name: body.name,
      show: body.show,
      type: body.type,
    }

    return this.prisma.column.update({ where: { id: columnId }, data })
  }

  async findById(columnId: string) {
    return this.prisma.column.findUnique({
      where: { id: columnId },
    })
  }

  async deleteColumn(id: string) {
    return this.prisma.column.delete({ where: { id } })
  }

  private async generateUniqueKey(
    key: string,
    companyId: string,
  ): Promise<string> {
    const existingKeys = await this.prisma.column.findMany({
      where: { companyId },
      select: { key: true },
    })
    let uniqueKey = key
    let suffix = 1

    while (existingKeys.some((column) => column.key === uniqueKey)) {
      uniqueKey = `${key}_${suffix++}`
    }

    return uniqueKey
  }

  private async updateTasksAfterColumnCreation(
    sheetId: string,
    key: string,
    type: string,
  ): Promise<void> {
    const fieldMapping = {
      text: ['text1', 'text2', 'text3', 'text4', 'text5'],
      number: ['number1', 'number2', 'number3', 'number4', 'number5'],
      checkbox: [
        'checkbox1',
        'checkbox2',
        'checkbox3',
        'checkbox4',
        'checkbox5',
      ],
      select: ['select1', 'select2', 'select3', 'select4', 'select5'],
      date: ['date1', 'date2', 'date3', 'date4', 'date5'],
    }

    const fieldsToCheck = fieldMapping[type] || []
    if (!fieldsToCheck.length) return

    const tasks = await this.task.findBySheet(sheetId)
    const fieldToUpdate = fieldsToCheck.find((field: string) =>
      tasks.some((task) => !task[field]),
    )

    if (!fieldToUpdate) return

    await this.task.updateMany({
      where: { sheetId, [fieldToUpdate]: null },
      data: { [fieldToUpdate]: key },
    })
  }
}
