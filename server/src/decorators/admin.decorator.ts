import { User } from '@user/dto/User.interface'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const Admin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
