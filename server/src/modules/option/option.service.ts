import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { OptionRepository } from './option.repository'
import { RoleService } from '@role/role.service'
import { UserService } from '@user/user.service'
import { IUser } from '@user/dto/IUser'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { RoleDto } from '@role/dto/role.dto'
import { RoleTypes } from '@prisma/client'
import { CreateOptionDto } from './dto/create-option.dto'
import { UpdateOptionDto } from './dto/uptdate-option.dto'

@Injectable()
export class OptionService {
  constructor(
    private readonly repository: OptionRepository,
    private readonly role: RoleService,
    private readonly user: UserService,
  ) {}

  async createOption(user: IUser, body: CreateOptionDto) {
    await this.validateUserRole(user)

    return this.repository.create(body)
  }

  async updateOption(user: IUser, id: string, body: UpdateOptionDto) {
    await this.validateUserRole(user)

    await this.findOne(id)

    return this.repository.update(id, body)
  }
  async deleteOption(user: IUser, id: string) {
    await this.validateUserRole(user)

    await this.findOne(id)

    return this.repository.delete(id)
  }
  async deleteOptions(user: IUser, selectId: string) {
    await this.validateUserRole(user)

    await this.repository.deleteMany(selectId)

    return { status: 'OK' }
  }

  private async findOne(id: string) {
    const option = await this.repository.findOne(id)

    if (!option) throw new NotFoundException(HTTP_MESSAGES.OPTION.NOT_FOUND)
  }

  private async validateUserRole(iUser: IUser): Promise<RoleDto> {
    const { id } = iUser
    const user = await this.user.getUser(id)
    if (!user) throw new BadRequestException(HTTP_MESSAGES.USER.NOT_FOUND)

    const selectedRole: RoleDto = await this.role.getUserSelectedRole(user)
    if (!selectedRole)
      throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)

    if (selectedRole.type !== RoleTypes.AUTHOR)
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)

    return selectedRole
  }
}
