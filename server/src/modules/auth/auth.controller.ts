import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { ReshreshTokenDto } from './dto/refresh.dto'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  RegistrationDto,
  RestoreAccountDto,
  RestoreAccountVerifyDto,
  VerifyRegistrationOtp,
} from './dto/registration.dto'
import { User } from '@decorators/user.decorator'
import { IUser } from './dto/IUser'
import { ChangeRoleDto } from './dto/change-role.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in' })
  login(@Body() body: LoginDto) {
    return this.service.login(body)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  refresh(@Body() body: ReshreshTokenDto) {
    return this.service.refreshToken(body)
  }

  @Post('registration')
  @ApiOperation({ summary: 'Registration' })
  registration(@Body() body: RegistrationDto) {
    return this.service.registration(body)
  }

  @Post('registration/verify')
  @ApiOperation({ summary: '2-step: Verify registration OTP' })
  verifyRegistrationOtp(@Body() body: VerifyRegistrationOtp) {
    return this.service.verifyRegistrationOtp(body)
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore account' })
  restoreAccount(@Body() body: RestoreAccountDto) {
    return this.service.restoreAccount(body)
  }

  @Post('restore/verify')
  @ApiOperation({ summary: 'Restore account verify' })
  restoreAccountVerify(@Body() body: RestoreAccountVerifyDto) {
    return this.service.restoreAccountVerify(body)
  }
  @Patch('change-role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change user current role' })
  selectRole(@User() user: IUser, @Body() body: ChangeRoleDto) {
    return this.service.changeRole(body, user)
  }
}
