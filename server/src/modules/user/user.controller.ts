import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UserService } from './user.service'
import { User } from '@/decorators/user.decorator'
import { IUser } from './dto/IUser'
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { ChangeRoleDto } from './dto/change-role.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'

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

  @Get(':email')
  @ApiOperation({ summary: 'Get user by email' })
  getUserByEmail(@Param('email') email: string) {
    return this.service.getUserByEmail(email)
  }

  @Patch('change-role')
  @ApiOperation({ summary: 'Change user current role' })
  selectRole(@User() user: IUser, @Body() body: ChangeRoleDto) {
    return this.service.changeRole(body, user)
  }

  @Patch('change-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Change user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, GIF, or WebP)',
        },
      },
      required: ['avatar'],
    },
  })
  changeAvatar(
    @User() user: IUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IUser> {
    return this.service.changeAvatar(file, user)
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change user password' })
  changePassword(@User() user: IUser, @Body() body: ChangePasswordDto) {
    return this.service.changePassword(body, user)
  }

  @Patch('update')
  @ApiOperation({ summary: 'Update user' })
  updateUser(@User() user: IUser, @Body() body: UpdateUserDto) {
    return this.service.updateUser(body, user)
  }
}
