import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegistrationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'Firstname' })
  firstName: string

  @IsString()
  @IsOptional()
  @ApiProperty({ required: true, example: 'Lastname' })
  lastName: string

  @IsEmail()
  @ApiProperty({ required: true, example: 'user@mail.com' })
  email: string

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'password' })
  password: string
}

export class VerifyRegistrationOtp {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Token which taken from generate Otp request',
    example: 'uuid',
  })
  token: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'OTP', example: '123456' })
  otp: string
}

export class RestoreAccountDto {
  @IsEmail()
  @ApiProperty({ required: true, example: 'user@mail.com' })
  email: string
}

export class RestoreAccountVerifyDto {
  @IsEmail()
  @ApiProperty({ required: true, example: 'user@mail.com' })
  email: string

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'OTP', example: '123456' })
  otp: string
}
