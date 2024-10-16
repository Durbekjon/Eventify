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

@Injectable()
export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
    private readonly sheet: SheetService,
  ) {}

  async getTasksBySheet(user: IUser, sheetId: string, query: TaskQueryDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.READ)

    let memberId = null

    if (role.type !== RoleTypes.AUTHOR && role.access.view === ViewType.OWN) {
      memberId = role.access.id
    }

    return this.repository.getTasksBySheet({ sheetId, memberId }, query)
  }

  async createTask(body: CreateTaskDto, user: IUser): Promise<Task> {
    const role = await this.validateUserAccess(user, MemberPermissions.CREATE)

    return this.repository.createTask(body, role.companyId)
  }

  async updateTask(
    id: string,
    body: UpdateTaskDto,
    user: IUser,
  ): Promise<Task> {
    const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)

    const task = await this.findById(id, role.companyId)

    return this.repository.updateTask(task.id, body)
  }

  async reorderTasks(user: IUser, body: TaskReorderDto) {
    await this.validateUserAccess(user, MemberPermissions.UPDATE)

    await this.repository.reorder(body)

    return {
      status: 'OK',
      result: HTTP_MESSAGES.TASKS_REORDERED,
    }
  }

  async moveTask(user: IUser, body: MoveTaskDto) {
    const role = await this.validateUserAccess(user, MemberPermissions.UPDATE)

    const sheet = await this.sheet.findOne(body.sheetId)
    if (
      role.type !== RoleTypes.AUTHOR &&
      role.access.view === ViewType.OWN &&
      !role.access.workspaces.some(
        (workspace) => workspace.id === sheet.workspaceId,
      )
    )
      throw new ForbiddenException(HTTP_MESSAGES.ACCESS_DENIED)

    const isTaskExist = await this.repository.findOne(body.taskId)

    if (!isTaskExist) throw new NotFoundException(HTTP_MESSAGES.TASK_NOT_FOUND)

    await this.repository.move(body, sheet.workspaceId)

    return {
      status: 'OK',
    }
  }

  async deleteTask(id: string, user: IUser) {
    const role = await this.validateUserAccess(user, MemberPermissions.DELETE)

    const task = await this.findById(id, role.companyId)

    await this.repository.deleteTask(task.id)

    return {
      status: 'OK',
      result: HTTP_MESSAGES.TASK_DELETE_SUCCESS,
    }
  }

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
    const { id } = iUser
    const user = await this.user.getUser(id)

    const selectedRole = await this.role.getUserSelectedRole({
      roles: user.roles,
      selectedRole: user.selectedRole,
    })

    if (!selectedRole)
      throw new BadRequestException(HTTP_MESSAGES.ROLE_NOT_EXIST)

    if (selectedRole.type === RoleTypes.AUTHOR) return selectedRole

    const userPermissions = selectedRole.access.permissions

    if (
      !userPermissions.includes(permission) &&
      !userPermissions.includes(MemberPermissions.ALL)
    )
      throw new ForbiddenException(HTTP_MESSAGES.ACCESS_DENIED)

    return selectedRole
  }

  private async findById(id: string, companyId: string) {
    const task = await this.repository.findById(id)

    if (!task || task.companyId !== companyId)
      throw new BadRequestException(HTTP_MESSAGES.TASK_NOT_FOUND)

    return task
  }
}
