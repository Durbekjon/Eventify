import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { UserService } from './user.service'
import { User } from '@/decorators/user.decorator'
import { IUser } from './dto/IUser'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'
import { ChangeRoleDto } from './dto/change-role.dto'
@ApiBearerAuth()
@ApiTags('User')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get user information' })
  getUserInfo(@User() user: IUser) {
    return this.service.getUserInfo(user)
  }

  @Patch('change-role')
  @ApiOperation({ summary: 'Change user current role' })
  selectRole(@User() user: IUser, @Body() body: ChangeRoleDto) {
    return this.service.changeRole(body, user)
  }
}
