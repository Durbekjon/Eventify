import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { LogRepository } from './log.repository'
import { IUser } from '@user/dto/IUser'
import { RoleDto } from '@auth/dto/auth-response.dto'
import { RoleService } from '@role/role.service'
import { UserService } from '@user/user.service'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { RoleTypes } from '@prisma/client'

@Injectable()
export class LogService {
  constructor(
    private readonly repository: LogRepository,
    private readonly role: RoleService,
    private readonly user: UserService,
  ) {}

  async getLogs(user: IUser) {
    const role = await this.validateUserRole(user)
    return this.repository.getByCompany(role.companyId)
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
