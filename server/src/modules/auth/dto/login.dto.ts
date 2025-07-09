import { IsEmail, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @IsEmail()
  @ApiProperty({ required: true, example: 'user@mail.com' })
  email: string

  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'password' })
  password: string
}
