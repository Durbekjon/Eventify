import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { ReshreshTokenDto } from './dto/refresh.dto'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  RegistrationDto,
  RestoreAccountDto,
  RestoreAccountVerifyDto,
  VerifyRegistrationOtp,
} from './dto/registration.dto'
import {
  LoginResponseDto,
  RegistrationResponseDto,
  RestoreAccountResponseDto,
  RestoreAccountVerifyResponseDto,
  TokenRefreshResponseDto,
  VerifyOtpResponseDto,
} from './dto/auth-response.dto'

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Sign in' })
  @ApiResponse({ type: () => LoginResponseDto })
  login(@Body() body: LoginDto) {
    return this.service.login(body)
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  @ApiResponse({ type: () => TokenRefreshResponseDto })
  refresh(@Body() body: ReshreshTokenDto) {
    return this.service.refreshToken(body)
  }

  @Post('registration')
  @ApiOperation({ summary: 'Registration' })
  @ApiResponse({ type: () => RegistrationResponseDto })
  registration(@Body() body: RegistrationDto) {
    return this.service.registration(body)
  }

  @Post('registration/verify')
  @ApiOperation({ summary: '2-step: Verify registration OTP' })
  @ApiResponse({ type: () => VerifyOtpResponseDto })
  verifyRegistrationOtp(@Body() body: VerifyRegistrationOtp) {
    return this.service.verifyRegistrationOtp(body)
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore account' })
  @ApiResponse({ type: () => RestoreAccountResponseDto })
  restoreAccount(@Body() body: RestoreAccountDto) {
    return this.service.restoreAccount(body)
  }

  @Post('restore/verify')
  @ApiOperation({ summary: 'Restore account verify' })
  @ApiResponse({ type: () => RestoreAccountVerifyResponseDto })
  restoreAccountVerify(@Body() body: RestoreAccountVerifyDto) {
    return this.service.restoreAccountVerify(body)
  }
}
