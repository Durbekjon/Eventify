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
import { Column, RoleTypes } from '@prisma/client'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { UpdateColumnDto } from './dto/update-column.dto'
import { RoleDto } from '@role/dto/role.dto'
import { fieldMapping } from '@consts/fields'

@Injectable()
export class ColumnService {
  constructor(
    private readonly repository: ColumnRepository,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async createColumn(body: CreateColumnDto, user: IUser) {
    const { role } = await this.validateUser(user)
    await this.validateUserRole(role.type, true)

    const fieldsToCheck = fieldMapping[body.type.toLowerCase()]
    if (!fieldsToCheck || fieldsToCheck.length === 0)
      throw new BadRequestException(HTTP_MESSAGES.COLUMN.INVALID_TYPE)

    const uniqueKey = await this.generateUniqueKey(fieldsToCheck, body.sheetId)

    if (!uniqueKey) throw new BadRequestException(HTTP_MESSAGES.COLUMN.LIMIT)

    return await this.repository.createColumn(body, uniqueKey, role.companyId)
  }

  async updateColumn(user: IUser, columnId: string, body: UpdateColumnDto) {
    const { role } = await this.validateUser(user)
    await this.validateUserRole(role.type, true)

    const column = await this.findById(columnId, role.companyId)
    return await this.repository.updateColumn(column.id, body)
  }

  async getColumnsBySheetId(user: IUser, sheetId: string): Promise<Column[]> {
    const { role } = await this.validateUser(user)
    await this.validateUserRole(role.type, false)

    return await this.repository.getColumnsBySheetId(sheetId)
  }

  async deleteColumn(columnId: string, user: IUser) {
    const { role } = await this.validateUser(user)
    await this.validateUserRole(role.type, true)

    const column = await this.findById(columnId, role.companyId)

    await this.repository.deleteColumn(column.id)

    return {
      status: 'OK',
      result: HTTP_MESSAGES.COLUMN.DELETE_SUCCESS,
    }
  }

  private async findById(columnId: string, companyId: string) {
    const column = await this.repository.findById(columnId)

    if (!column || column.companyId !== companyId) {
      throw new NotFoundException(HTTP_MESSAGES.COLUMN.NOT_FOUND)
    }

    return column
  }

  private async generateUniqueKey(fieldsToCheck: any[], sheetId: string) {
    const columns = await this.repository.getColumnsBySheetId(sheetId)

    return fieldsToCheck.find(
      (field) => !columns.some((col) => col.key === field),
    )
  }

  private async validateUser(user: IUser) {
    const userDetails = await this.userService.getUser(user.id)
    const selectedRole: RoleDto = this.roleService.getUserSelectedRole({
      roles: userDetails.roles,
      selectedRole: userDetails.selectedRole,
    })
    return { role: selectedRole }
  }
  private async validateUserRole(userRole: RoleTypes, access: boolean) {
    if (userRole === RoleTypes.AUTHOR || !access) return
  }
}
