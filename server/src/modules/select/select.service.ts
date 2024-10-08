import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { SelectRepository } from './select.repository'
import { CreateSelectDto } from './dto/create-select.dto'
import { IUser } from '../user/dto/IUser'
import { UpdateSelectDto } from './dto/update-select.dto'
import { DeleteSelectsDto } from './dto/delete-selects.dto'
import { HTTP_MESSAGES } from '@/consts/http-messages'
import { UserService } from '../user/user.service'
import { RoleService } from '../role/role.service'
import { RoleTypes } from '@prisma/client'
import {
  DeleteResponseDto,
  SelectResponseDto,
  SelectsResponseDto,
  UpdateSelectResponseDto,
} from './dto/select-response.dto'

@Injectable()
export class SelectService {
  constructor(
    private readonly repository: SelectRepository,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async createSelect(
    body: CreateSelectDto,
    user: IUser,
  ): Promise<SelectResponseDto> {
    const { companyId } = await this.validateUserRole(user)
    const createdSelect = await this.repository.createSelect(body, companyId)

    return this.mapSelectToResponseDto(createdSelect)
  }

  async getSelects(user: IUser): Promise<SelectsResponseDto> {
    const { companyId } = await this.validateUserRole(user)
    const selects = await this.repository.getSelects(companyId)

    return {
      selects: selects.map(this.mapSelectToResponseDto),
    }
  }

  async getSelect(user: IUser, id: string): Promise<SelectResponseDto> {
    const { companyId } = await this.validateUserRole(user)
    return this.findSelectById(id, companyId)
  }

  async updateSelect(
    user: IUser,
    id: string,
    body: UpdateSelectDto,
  ): Promise<UpdateSelectResponseDto> {
    const { companyId } = await this.validateUserRole(user)
    await this.findSelectById(id, companyId)
    const updatedSelect = await this.repository.updateSelect(id, body)

    return this.mapSelectToUpdateResponseDto(updatedSelect)
  }

  async deleteSelect(user: IUser, id: string): Promise<DeleteResponseDto> {
    const { companyId } = await this.validateUserRole(user)
    await this.findSelectById(id, companyId)
    await this.repository.deleteSelect(id)

    return { message: HTTP_MESSAGES.SELECT_DELETE_SUCCESS, success: true }
  }

  async deleteSelects(
    user: IUser,
    body: DeleteSelectsDto,
  ): Promise<DeleteResponseDto> {
    await this.repository.findManyByIds(body.ids)
    await this.repository.deleteSelects(body.ids)

    return {
      message: HTTP_MESSAGES.SELECT_DELETE_MULTIPLE_SUCCESS,
      success: true,
    }
  }

  private async validateUserRole(user: IUser) {
    const currentUser = await this.userService.getUser(user.id)
    const selectedRole = this.roleService.getUserSelectedRole({
      roles: currentUser.roles,
      selectedRole: currentUser.selectedRole,
    })

    if (!selectedRole || selectedRole.type !== RoleTypes.AUTHOR) {
      throw new BadRequestException(HTTP_MESSAGES.ROLE_NOT_EXIST)
    }

    return selectedRole
  }

  private async findSelectById(
    selectId: string,
    companyId: string,
  ): Promise<SelectResponseDto> {
    const select = await this.repository.getSelect(selectId)
    if (!select || select.companyId !== companyId) {
      throw new NotFoundException(HTTP_MESSAGES.SELECT_NOT_FOUND)
    }
    return this.mapSelectToResponseDto(select)
  }

  private mapSelectToResponseDto(select: any): SelectResponseDto {
    return {
      id: select.id,
      name: select.value,
      description: select.color,
      companyId: select.companyId,
      createdAt: select.createdAt,
      updatedAt: select.updatedAt,
    }
  }

  private mapSelectToUpdateResponseDto(select: any): UpdateSelectResponseDto {
    return {
      id: select.id,
      name: select.value,
      description: select.color,
    }
  }
}
