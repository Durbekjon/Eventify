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
import { UpdateUserDto } from './dto/update-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UtilsService } from '@core/utils/utils.service'

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly avatarService: AvatarService,
    private readonly utils: UtilsService,
  ) {}

  async createUser(email: string, password: string): Promise<IUser> {
    const hashPassword = await this.utils.generateBcrypt(password)
    return this.repository.createUser(email, hashPassword)
  }
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

  async updateUser(body: UpdateUserDto, user: IUser) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...updatedUser } = await this.repository.updateUser(
      user.id,
      body,
    )
    return updatedUser
  }

  async changePassword(body: ChangePasswordDto, iUser: IUser) {
    const { oldPassword, newPassword } = body
    const user = await this.findUserById(iUser.id)

    if (!user.password)
      throw new BadRequestException(HTTP_MESSAGES.USER.NOT_FOUND)

    const isPasswordValid = await this.utils.compareHash(
      oldPassword,
      user.password,
    )

    if (!isPasswordValid)
      throw new BadRequestException(HTTP_MESSAGES.AUTH.WRONG_PASSWORD)

    const hashedPassword = await this.utils.generateBcrypt(newPassword)
    await this.repository.changePassword(user.id, hashedPassword)

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
