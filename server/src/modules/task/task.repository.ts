import { PrismaService } from '@core/prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { Prisma, Task } from '@prisma/client'
import { UpdateTaskDto } from './dto/update-task.dto'
import { Injectable } from '@nestjs/common'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'

@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOne(id: string) {
    return this.prisma.task.findUnique({ where: { id } })
  }

  async getTasksBySheet(
    options: { sheetId: string; memberId: string | null },
    reqQuery: TaskQueryDto,
  ): Promise<Task[]> {
    const { sheetId, memberId } = options
    const {
      name,
      status,
      priority,
      minPrice,
      maxPrice,
      paid,
      new: isNew,
    } = reqQuery

    const booleanPaid =
      String(paid) === 'true' ? true : String(paid) === 'false' ? false : null

    // Build the base query
    const query: Prisma.TaskFindManyArgs = {
      where: {
        sheetId,
        ...(name && { name: { contains: name } }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(minPrice !== undefined && { price: { gte: Number(minPrice) } }),
        ...(maxPrice !== undefined && { price: { lte: Number(maxPrice) } }),
        ...(paid !== undefined && { paid: booleanPaid }), // Make sure paid is a boolean
        ...(memberId && {
          members: {
            some: {
              id: memberId,
            },
          },
        }),
      },
      orderBy: isNew ? { createdAt: 'desc' } : { order: 'asc' },
    }

    // Fetch and return the tasks
    try {
      return await this.prisma.task.findMany(query)
    } catch (error) {
      // Handle error (e.g., log it and throw a custom exception)
      throw new Error('Failed to fetch tasks: ' + error.message)
    }
  }

  async createTask(body: CreateTaskDto, companyId: string): Promise<Task> {
    const sheet = await this.prisma.sheet.findUnique({
      where: { id: body.sheetId },
    })

    const data: Prisma.TaskCreateInput = {
      name: body.name,
      workspace: { connect: { id: sheet.workspaceId } },
      sheet: { connect: { id: body.sheetId } },
      company: { connect: { id: companyId } },
      ...(body.status && { status: body.status }),
      ...(body.members && {
        members: { connect: body.members.map((id) => ({ id })) },
      }),
      ...(body.priority && { priority: body.priority }),
      ...(body.link && { link: body.link }),
      ...(body.price && { price: body.price }),
      ...(body.paid !== null && { paid: body.paid }),
    }

    try {
      return await this.prisma.task.create({ data })
    } catch (error) {
      throw new Error('Failed to create task: ' + error.message)
    }
  }

  async updateTask(taskId: string, body: UpdateTaskDto): Promise<Task> {
    const data: Prisma.TaskUpdateInput = {
      name: body.name,
      ...(body.status && { status: body.status }),
      ...(body.members && {
        members: { connect: body.members.map((id) => ({ id })) },
      }),
      ...(body.priority && { priority: body.priority }),
      ...(body.link && { link: body.link }),
      ...(body.price && { price: body.price }),
      ...(body.paid !== null && { paid: body.paid }),
    }

    try {
      return await this.prisma.task.update({ where: { id: taskId }, data })
    } catch (error) {
      throw new Error('Failed to update task: ' + error.message)
    }
  }

  async reorder(body: TaskReorderDto) {
    return this.prisma
      .$transaction(
        body.taskId.map((id, index) =>
          this.prisma.task.update({
            where: { id },
            data: { order: body.orders[index] },
          }),
        ),
      )
      .catch((error) => {
        throw new Error('Failed to reorder tasks: ' + error.message)
      })
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
      throw new Error('Failed to delete task: ' + error.message)
    }
  }

  async findById(taskId: string): Promise<Task | null> {
    return this.prisma.task.findUnique({ where: { id: taskId } })
  }

  async findBySheet(sheetId: string): Promise<Task[]> {
    return this.prisma.task.findMany({ where: { sheetId } })
  }

  async updateMany(args: Prisma.TaskUpdateManyArgs) {
    return this.prisma.task.updateMany(args)
  }
}
