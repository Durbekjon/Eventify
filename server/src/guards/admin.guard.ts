import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'
import { UserService } from '@user/user.service'
import { HTTP_MESSAGES } from '@consts/http-messages'

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)

    const request = context.switchToHttp().getRequest()
    const user = request.user

    const currentUser = await this.userService.getUser(user.id)
    if (!currentUser)
      throw new UnauthorizedException(HTTP_MESSAGES.USER.NOT_FOUND)

    if (!currentUser.isAdmin)
      throw new ForbiddenException(HTTP_MESSAGES.GENERAL.ACCESS_DENIED)

    request.user = currentUser
    return true
  }
}
