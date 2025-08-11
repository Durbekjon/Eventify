import { CreateTaskDto } from './dto/create-task.dto'
import { Prisma, Task } from '@prisma/client'
import { Injectable } from '@nestjs/common'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { IPagination } from '@core/types/pagination'
import { PrismaService } from '@core/prisma/prisma.service'
import { TaskWithRelations } from './types/task.types'

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: { members: true, chat: true },
    })
  }

  // Helper method to validate search filters
  private validateSearchFilters(search: any[]): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const validFields = [
      'name',
      'status',
      'priority',
      'link',
      'price',
      'paid',
      'text1',
      'text2',
      'text3',
      'text4',
      'text5',
      'number1',
      'number2',
      'number3',
      'number4',
      'number5',
      'checkbox1',
      'checkbox2',
      'checkbox3',
      'checkbox4',
      'checkbox5',
      'select1',
      'select2',
      'select3',
      'select4',
      'select5',
      'date1',
      'date2',
      'date3',
      'date4',
      'date5',
      'link1',
      'link2',
      'link3',
      'link4',
      'link5',
    ]

    if (!Array.isArray(search)) {
      errors.push('Search must be an array')
      return { isValid: false, errors }
    }

    for (const filter of search) {
      if (!filter || typeof filter !== 'object') {
        errors.push('Each search filter must be an object')
        continue
      }

      const { key, value } = filter

      if (!key || typeof key !== 'string') {
        errors.push('Search filter key must be a non-empty string')
        continue
      }

      if (!validFields.includes(key)) {
        errors.push(
          `Invalid search field: ${key}. Valid fields are: ${validFields.join(', ')}`,
        )
        continue
      }

      if (value === undefined || value === null || value === '') {
        errors.push(`Search filter value for ${key} cannot be empty`)
        continue
      }
    }

    return { isValid: errors.length === 0, errors }
  }

  // Simplified method to build search conditions with smart type detection
  private buildSearchCondition(key: string, value: string): any {
    // Define field types
    const stringFields = [
      'name',
      'status',
      'priority',
      'link',
      'text1',
      'text2',
      'text3',
      'text4',
      'text5',
      'select1',
      'select2',
      'select3',
      'select4',
      'select5',
      'link1',
      'link2',
      'link3',
      'link4',
      'link5',
    ]

    const numberFields = [
      'price',
      'number1',
      'number2',
      'number3',
      'number4',
      'number5',
    ]
    const booleanFields = [
      'paid',
      'checkbox1',
      'checkbox2',
      'checkbox3',
      'checkbox4',
      'checkbox5',
    ]
    const dateFields = ['date1', 'date2', 'date3', 'date4', 'date5']

    // Smart type detection and condition building
    if (stringFields.includes(key)) {
      return {
        contains: value,
        mode: 'insensitive' as const,
      }
    }

    if (numberFields.includes(key)) {
      const numValue = Number(value)
      if (isNaN(numValue)) {
        throw new Error(`Invalid number value for field ${key}: ${value}`)
      }
      return numValue
    }

    if (booleanFields.includes(key)) {
      const boolValue =
        value === 'true' ||
        value === '1' ||
        (typeof value === 'boolean' && value) ||
        (typeof value === 'number' && value === 1)
      return Boolean(boolValue)
    }

    if (dateFields.includes(key)) {
      const dateValue = new Date(value)
      if (isNaN(dateValue.getTime())) {
        throw new Error(`Invalid date value for field ${key}: ${value}`)
      }
      return dateValue
    }

    // Default to string search
    return {
      contains: value,
      mode: 'insensitive' as const,
    }
  }

  async getTasksBySheet(
    options: { sheetId: string; memberId: string | null },
    reqQuery: TaskQueryDto,
  ): Promise<{ tasks: Task[]; pagination: IPagination }> {
    const { sheetId, memberId } = options
    const { page = 1, limit = 12, search, order } = reqQuery

    const parsedPage = Number(page)
    const parsedLimit = Number(limit)

    // ✅ Start with base filters
    let whereConditions: Prisma.TaskWhereInput = {
      sheetId,
      ...(memberId && {
        members: {
          some: { id: memberId },
        },
      }),
    }

    if (search) {
      whereConditions = {
        ...whereConditions,
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }
    }

    try {
      const [tasks, count] = await Promise.all([
        this.prisma.task.findMany({
          where: whereConditions,
          include: {
            members: {
              include: {
                user: {
                  include: {
                    avatar: {
                      select: {
                        id: true,
                        path: true,
                      },
                    },
                  },
                },
              },
            },
            chat: true,
          },
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit,
          orderBy: { createdAt: order },
        }),
        this.prisma.task.count({
          where: whereConditions,
        }),
      ])

      return {
        tasks,
        pagination: {
          page: parsedPage,
          pages: Math.ceil(count / parsedLimit),
          limit: parsedLimit,
          count,
        },
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch tasks for sheet ID ${sheetId}: ${error.message}`,
      )
    }
  }

  async createTask(body: CreateTaskDto, companyId: string): Promise<Task> {
    const { sheetId, name, members, status, priority, link, price, paid } = body

    // Find the sheet and retrieve workspaceId, validate existence
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: sheetId },
      select: { workspaceId: true },
    })

    if (!sheet) {
      throw new Error(`Sheet with ID ${sheetId} not found.`)
    }

    // Construct task creation data
    const taskData: Prisma.TaskCreateInput = {
      name,
      workspace: { connect: { id: sheet.workspaceId } },
      sheet: { connect: { id: sheetId } },
      company: { connect: { id: companyId } },
      chat: {
        create: {
          name,
          members: members
            ? { connect: members.map((id) => ({ id })) }
            : undefined,
          permissions: { create: {} },
        },
      },
      members: members ? { connect: members.map((id) => ({ id })) } : undefined,
      status,
      priority,
      link,
      price,
      paid,
    }

    try {
      return await this.prisma.task.create({ data: taskData })
    } catch (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }
  }

  async updateTask(
    taskId: string,
    updateData: Prisma.TaskUpdateInput,
  ): Promise<Task> {
    try {
      // Transform all date fields to ISO-8601 if present
      const dateFields = ['date1', 'date2', 'date3', 'date4', 'date5']
      for (const field of dateFields) {
        if (updateData[field]) {
          updateData[field] = this.toIsoStringIfExists(updateData[field])
        }
      }

      return await this.prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          members: true,
          chat: true,
        },
      })
    } catch (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }
  }

  async reorder(body: TaskReorderDto) {
    await this.prisma
      .$transaction(
        body.taskId.map((id, index) =>
          this.prisma.task.update({
            where: { id },
            data: { order: body.orders[index] },
          }),
        ),
      )
      .catch((error) => {
        throw new Error(`Failed to reorder tasks: ${error.message}`)
      })
    const task = await this.prisma.task.findUnique({
      where: { id: body.taskId[0] },
    })

    return task
  }

  async move(body: MoveTaskDto, workspaceId: string) {
    return await this.prisma.task.update({
      where: { id: body.taskId },
      data: {
        sheet: {
          connect: {
            id: body.sheetId,
          },
        },
        workspace: {
          connect: {
            id: workspaceId,
          },
        },
      },
    })
  }

  async deleteTask(taskId: string): Promise<Task> {
    try {
      return await this.prisma.task.delete({ where: { id: taskId } })
    } catch (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }

  async findById(id: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: { members: true, chat: true },
    })
  }

  async findBySheet(sheetId: string): Promise<Task[]> {
    return this.prisma.task.findMany({ where: { sheetId } })
  }

  async updateMany(args: Prisma.TaskUpdateManyArgs) {
    return this.prisma.task.updateMany(args)
  }

  private toIsoStringIfExists(date) {
    return date ? new Date(date).toISOString() : undefined
  }
}
