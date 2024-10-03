import { PrismaService } from '@core/prisma/prisma.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { Prisma, Task } from '@prisma/client'
import { UpdateTaskDto } from './dto/update-task.dto'
import { Injectable } from '@nestjs/common'
@Injectable()
export class TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  createTask(body: CreateTaskDto, companyId: string): Promise<Task> {
    const data: Prisma.TaskCreateInput = {
      workspace: { connect: { id: body.workspaceId } },
      sheet: { connect: { id: body.sheetId } },
      company: { connect: { id: companyId } },
    }

    if (body.status) data.status = body.status
    if (body.members)
      data.members = { connect: body.members.map((id) => ({ id })) }
    if (body.priority) data.priority = body.priority
    if (body.link) data.link = body.link
    if (body.price) data.price = body.price
    if (body.paid !== null) data.paid = body.paid

    return this.prisma.task.create({ data })
  }

  updateTask(taskId: string, body: UpdateTaskDto): Promise<Task> {
    const data: Prisma.TaskUpdateInput = {}

    if (body.status) data.status = body.status
    if (body.members)
      data.members = { connect: body.members.map((id) => ({ id })) }
    if (body.priority) data.priority = body.priority
    if (body.link) data.link = body.link
    if (body.price) data.price = body.price
    if (body.paid !== null) data.paid = body.paid

    return this.prisma.task.update({ where: { id: taskId }, data })
  }

  deleteTask(taskId: string) {
    return this.prisma.task.delete({ where: { id: taskId } })
  }

  findById(taskId: string) {
    return this.prisma.task.findUnique({ where: { id: taskId } })
  }

  findBySheet(sheetId: string) {
    return this.prisma.task.findMany({ where: { sheetId } })
  }

  updateMany(args: Prisma.TaskUpdateManyArgs) {
    return this.prisma.task.updateMany(args)
  }
}
