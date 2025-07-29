import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UserRepository } from './user.repository'
import { IUser } from './dto/IUser'
import { ChangeRoleDto } from './dto/change-role.dto'
import { HTTP_MESSAGES } from '@consts/http-messages'
import { User } from './dto/User.interface'
import { AvatarService } from './avatar.service'

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly avatarService: AvatarService,
  ) {}

  getUser(id: string) {
    return this.repository.getUser(id)
  }

  getUserInfo(user: IUser) {
    return this.repository.getUserInfo(user)
  }

  async getUserByEmail(email: string) {
    const user = await this.repository.getUserByEmail(email)
    if (!user) throw new NotFoundException(HTTP_MESSAGES.USER.NOT_FOUND)

    return user
  }

  async changeAvatar(file: Express.Multer.File, user: IUser): Promise<IUser> {
    const avatarFile = await this.avatarService.uploadAvatar(file, user)
    const userWithAvatar = await this.repository.changeAvatar(
      user.id,
      avatarFile.id,
    )
    return userWithAvatar
  }

  async changeRole(body: ChangeRoleDto, iUser: IUser) {
    const { roleId } = body

    const user = await this.findUserById(iUser.id)

    await this.validateUserRole(user, roleId)

    await this.repository.changeRole(user.id, roleId)

    return { result: 'OK' }
  }

  private async findUserById(id: string) {
    const user = await this.repository.getUser(id)

    if (!user) throw new NotFoundException(HTTP_MESSAGES.USER.NOT_FOUND)

    return user
  }

  private async validateUserRole(user: User, roleId: string) {
    const hasRole = user.roles.some((role) => role.id === roleId)

    if (!hasRole) throw new BadRequestException(HTTP_MESSAGES.ROLE.NOT_EXIST)

    return true
  }
}
