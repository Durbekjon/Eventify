import { PrismaService } from '@core/prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { Prisma, Task } from '@prisma/client'
import { UpdateTaskDto } from './dto/update-task.dto'
import { Injectable } from '@nestjs/common'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { IPagination } from '@core/types/pagination'
import { TaskWithRelations } from './types/task.types'

@Injectable()
class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string): Promise<TaskWithRelations | null> {
    return this.prisma.task.findUnique({
      where: { id },
      include: { members: true, chat: true },
    })
  }

  async getTasksBySheet(
    options: { sheetId: string; memberId: string | null },
    reqQuery: TaskQueryDto,
  ): Promise<{ tasks: Task[]; pagination: IPagination }> {
    const { sheetId, memberId } = options
    const { page = 1, limit = 12, search = [], order } = reqQuery

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

    // ✅ Add dynamic filters based on `search` array
    if (Array.isArray(search) && search.length > 0) {
      for (const filter of search) {
        const { key, value } = filter

        if (key && value) {
          // Optionally sanitize or validate key/value

          // Note: Adjust logic depending on field types
          whereConditions = {
            ...whereConditions,
            [key]: {
              contains: value,
              mode: 'insensitive', // For case-insensitive match
            },
          }
        }
      }
    }

    try {
      const [tasks, count] = await Promise.all([
        this.prisma.task.findMany({
          where: whereConditions,
          include: { members: true, chat: true },
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

export { TaskRepository }
