import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ColumnRepository } from './column.repository'
import { UserService } from '@user/user.service'
import { RoleService } from '@role/role.service'
import { CreateColumnDto } from './dto/create-column.dto'
import { IUser } from '@user/dto/IUser'
import { RoleTypes } from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UpdateColumnDto } from './dto/update-column.dto'
import { RoleDto } from '@role/dto/role.dto'

@Injectable()
export class ColumnService {
  constructor(
    private readonly repository: ColumnRepository,
    private readonly user: UserService,
    private readonly role: RoleService,
  ) {}

  async createColumn(body: CreateColumnDto, user: IUser) {
    const role = await this.validateUserRole(user)

    return this.repository.createColumn(body, role.companyId)
  }

  async updateColumn(user: IUser, columnId: string, body: UpdateColumnDto) {
    const role = await this.validateUserRole(user)

    const column = await this.findById(columnId, role.companyId)

    return this.repository.updateColumn(column.id, body)
  }

  async deleteColumn(columnId: string, user: IUser) {
    const role = await this.validateUserRole(user)

    const column = await this.findById(columnId, role.companyId)

    await this.repository.deleteColumn(column.id)

    return {
      status: 'OK',
      result: HTTP_MESSAGES.COLUMN.DELETE_SUCCESS,
    }
  }

  private async findById(columnId: string, companyId: string) {
    const column = await this.repository.findById(columnId)

    if (!column || column.companyId !== companyId)
      throw new NotFoundException(HTTP_MESSAGES.COLUMN.NOT_FOUND)

    return column
  }

  private async validateUserRole(iUser: IUser) {
    const userId = iUser.id
    const user = await this.user.getUser(userId)

    const selectedRole: RoleDto = this.role.getUserSelectedRole({
      roles: user.roles,
      selectedRole: user.selectedRole,
    })

    // if (selectedRole.company.isBlocked === true) throw new BadRequestException()
    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR)
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)

    return selectedRole
  }
}
