import { ApiProperty } from '@nestjs/swagger'
export class RoleDto {
  @ApiProperty({ description: 'Unique identifier for the role' })
  id: string

  @ApiProperty({ description: 'Type of role (e.g., AUTHOR, MEMBER, VIEWER)' })
  type: string

  @ApiProperty({ description: 'ID of the company the role belongs to' })
  companyId: string
}

export class UserDto {
  @ApiProperty({ description: 'Unique identifier for the user' })
  id: string

  @ApiProperty({ description: 'First name of the user' })
  firstName: string

  @ApiProperty({ description: 'Last name of the user' })
  lastName: string

  @ApiProperty({ description: 'Email address of the user' })
  email: string

  @ApiProperty({
    type: [RoleDto],
    description: 'List of roles associated with the user',
  })
  roles: RoleDto[]
}

export class TokenDto {
  @ApiProperty({ description: 'JWT access token' })
  access: string

  @ApiProperty({ description: 'JWT refresh token' })
  refresh: string
}


export class LoginResponseDto {
  @ApiProperty({ description: 'Simplified user object without password' })
  user: UserDto

  @ApiProperty({ description: 'Access and refresh tokens' })
  token: TokenDto
}


export class RegistrationResponseDto {
  @ApiProperty({
    description: 'Unique token associated with the verification code',
  })
  token: string
}

export class VerifyOtpResponseDto {
  @ApiProperty({ description: 'User details after successful registration' })
  user: UserDto

  @ApiProperty({ description: 'JWT tokens for the newly registered user' })
  token: TokenDto
}

export class RestoreAccountResponseDto {
  @ApiProperty({
    description: 'Confirmation message indicating OTP has been sent',
  })
  message: string
}

export class RestoreAccountVerifyResponseDto {
  @ApiProperty({ description: 'User details after OTP verification' })
  user: UserDto

  @ApiProperty({ description: 'New JWT tokens for the user' })
  token: TokenDto
}

export class TokenRefreshResponseDto {
  @ApiProperty({ description: 'New access and refresh tokens' })
  token: TokenDto
}
