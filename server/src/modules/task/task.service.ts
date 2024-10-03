import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { IUser } from '@user/dto/IUser'
import { TaskRepository } from './task.repository'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { MemberPermissions, Prisma, Task } from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'

@Injectable()
export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
  ) {}

  async createTask(body: CreateTaskDto, user: IUser): Promise<Task> {
    try {
      const role = await this.validateUserAccess(user, MemberPermissions.CREATE)

      return this.repository.createTask(body, role.companyId)
    } catch (e) {
      console.log(e)
    }
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

  async validateUserAccess(iUser: IUser, permission: MemberPermissions) {
    const { id } = iUser
    const user = await this.user.getUser(id)

    const selectedRole = await this.role.getUserSelectedRole({
      roles: user.roles,
      selectedRole: user.selectedRole,
    })

    if (!selectedRole)
      throw new BadRequestException(HTTP_MESSAGES.ROLE_NOT_EXIST)

    if ((selectedRole.type = 'AUTHOR')) return selectedRole

    const userPermissions = selectedRole.access.permissions

    if (
      !userPermissions.inludes(permission) ||
      !userPermissions.inludes(MemberPermissions.ALL)
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
