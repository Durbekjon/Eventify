import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { IUser } from '@user/dto/IUser'
import { TaskRepository } from './task.repository'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import {
  MemberPermissions,
  Prisma,
  RoleTypes,
  Task,
  ViewType,
} from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { TaskReorderDto } from './dto/reorder-tasks.dto'
import { TaskQueryDto } from './dto/query.task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { RoleDto } from '@role/dto/role.dto'
import { SheetService } from '@sheet/sheet.service'
import { fieldsToCheck } from './dto/task.fields'
import { PrismaService } from '@core/prisma/prisma.service'
import { MemberService } from '@member/member.service'
import { TaskWithRelations } from './types/task.types'

@Injectable()
export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    private readonly sheet: SheetService,
    private readonly prisma: PrismaService,
    private readonly member: MemberService,
  ) {}

  // TASK RETRIEVAL
  async getTasksBySheet(user: IUser, sheetId: string, query: TaskQueryDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.READ)
    const memberId = this.getMemberIdForTaskRetrieval(role)
    return this.repository.getTasksBySheet({ sheetId, memberId }, query)
  }

  // TASK CREATION
  async createTask(body: CreateTaskDto, user: IUser): Promise<Task> {
    const role = await this.validateUserAccess(user, MemberPermissions.CREATE)
    if(role.type === RoleTypes.MEMBER) {
      body.members = [role.access.id]
    }
    if (body.members?.length > 0) {
      await this.validateBodyMembers(body)
    }

    const task = await this.repository.createTask(body, role.companyId)

    await this.logUserAction(
      user.id,
      role.companyId,
      `Created task: ${body.name}`,
      task.id,
      task.workspaceId,
      task.sheetId,
    )

    return task
  }

  // TASK UPDATING
  async updateTask(id: string, body: UpdateTaskDto, user: IUser): Promise<Task> {
    const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
    const task = await this.findById(id, role.companyId)

    const updateData: Prisma.TaskUpdateInput = {}
    const changes: Array<{ updatedKey: string; oldValue: any; newValue: any }> = []

    // Process regular fields
    for (const field of fieldsToCheck) {
      if (body[field] !== undefined && task[field] !== body[field]) {
        changes.push({
          updatedKey: field,
          oldValue: task[field],
          newValue: body[field],
        })
        updateData[field] = body[field]
      }
    }

    // Handle members separately
    if (body.members !== undefined) {
      changes.push({
        updatedKey: 'members',
        oldValue: task.members,
        newValue: body.members,
      })

      if (body.members.length > 0) {
        await this.validateBodyMembers(body)
        updateData.members = {
          set: body.members.map(id => ({ id })),
        }
      } else {
        updateData.members = { set: [] }
      }

      // Update chat members as well
      updateData.chat = {
        update: {
          members: updateData.members
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return task // No changes
    }

    const updatedTask = await this.repository.updateTask(task.id, updateData)
    await this.logTaskChanges(changes, role.companyId, user.id)
    return updatedTask
  }

  // TASK REORDERING
  async reorderTasks(user: IUser, body: TaskReorderDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
    const result = await this.repository.reorder(body)

    await this.logUserAction(
      user.id,
      role.companyId,
      'Reordered tasks',
      null,
      result.workspaceId,
      result.sheetId,
    )

    return this.createResponse(HTTP_MESSAGES.TASK.REORDER_SUCCESS)
  }

  // TASK MOVING
  async moveTask(user: IUser, body: MoveTaskDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)
    const sheet = await this.sheet.findOne(body.sheetId)

    this.validateMoveTaskAccess(role, sheet)
    await this.ensureTaskExists(body.taskId)

    await this.repository.move(body, sheet.workspaceId)
    return this.createResponse(HTTP_MESSAGES.TASK.MOVE_SUCCESS)
  }

  // TASK DELETION
  async deleteTask(id: string, user: IUser): Promise<any> {
    const role = await this.validateUserAccess(user, MemberPermissions.DELETE)
    const task = await this.findById(id, role.companyId)

    await this.logUserAction(
      user.id,
      role.companyId,
      `Task deleted: ${task.name}`,
      task.id,
      task.workspaceId,
      task.sheetId,
    )

    await this.repository.deleteTask(task.id)
    return this.createResponse(HTTP_MESSAGES.TASK.DELETE_SUCCESS)
  }

  // SHARED FUNCTIONALITY
  findBySheet(sheet: string) {
    return this.repository.findBySheet(sheet)
  }

  updateMany(args: Prisma.TaskUpdateManyArgs) {
    return this.repository.updateMany(args)
  }

  private async validateUserAccess(
    iUser: IUser,
    permission: MemberPermissions,
  ): Promise<RoleDto> {
    const user = await this.user.getUser(iUser.id)
    const selectedRole = await this.role.getUserSelectedRole({
      roles: user.roles,
      selectedRole: user.selectedRole,
    })

    if (!selectedRole)
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)
    if (selectedRole.type === RoleTypes.AUTHOR) return selectedRole

    const userPermissions = selectedRole.access.permissions
    if (
      !userPermissions.includes(permission) &&
      !userPermissions.includes(MemberPermissions.ALL)
    ) {
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
    }
    return selectedRole
  }

  private async findById(id: string, companyId: string): Promise<TaskWithRelations> {
    const task = await this.repository.findById(id)
    if (!task || task.companyId !== companyId) {
      throw new BadRequestException(HTTP_MESSAGES.TASK.NOT_FOUND)
    }
    return task
  }

  private getMemberIdForTaskRetrieval(role: RoleDto): string | null {
    return role.type !== RoleTypes.AUTHOR && !role.access.permissions.includes(MemberPermissions.ALL) ? role.access.id : null
  }

  private async validateBodyMembers(body: CreateTaskDto | UpdateTaskDto) {
    const notFoundMembers: string[] = []

    const validatePromise = body.members.map(async (memberId: string) => {
      const data = await this.member.findOneMember(memberId)
      if (!data) notFoundMembers.push(memberId)
    })

    await Promise.all(validatePromise)

    if (notFoundMembers.length > 0) {
      const responseMessage: string = `Members not found with ids' ${notFoundMembers.join(', ')}`
      throw new BadRequestException(responseMessage)
    }
  }

  private async logTaskChanges(
    changes: Array<{ updatedKey: string; oldValue: any; newValue: any }>,
    companyId: string,
    userId: string,
  ) {
    const logs = changes.map((change) => ({
      message: `Task ${change.updatedKey} changed from ${change.oldValue} to ${change.newValue}`,
      companyId,
      userId,
      updatedKey: change.updatedKey,
      oldValue: change.oldValue?.toString(),
      newValue: change.newValue?.toString(),
    }))
    await this.prisma.log.createMany({ data: logs })
  }

  private async ensureTaskExists(taskId: string) {
    const isTaskExist = await this.repository.findOne(taskId)
    if (!isTaskExist) throw new NotFoundException(HTTP_MESSAGES.TASK.NOT_FOUND)
  }

  private validateMoveTaskAccess(role: RoleDto, sheet: any) {
    if (
      role.type !== RoleTypes.AUTHOR &&
      role.access.view === ViewType.OWN &&
      !role.access.workspaces.some(
        (workspace) => workspace.id === sheet.workspaceId,
      )
    ) {
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)
    }
  }

  private createResponse(message: string) {
    return { status: 'OK', result: message }
  }

  private async logUserAction(
    userId: string,
    companyId: string,
    logMessage: string,
    relatedTaskId: string | null,
    workspaceId: string | null,
    sheetId: string | null,
  ) {
    const logData: Prisma.LogCreateInput = {
      message: logMessage,
      user: { connect: { id: userId } },
      company: { connect: { id: companyId } },
      task: relatedTaskId ? { connect: { id: relatedTaskId } } : undefined,
      workspace: workspaceId ? { connect: { id: workspaceId } } : undefined,
      sheet: sheetId ? { connect: { id: sheetId } } : undefined,
    }
    await this.prisma.log.create({ data: logData })
  }
}
