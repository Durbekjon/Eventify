import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength, Matches } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The old password of the user',
    example: 'oldPassword123!',
  })
  @IsString({ message: 'Old password must be a string.' })
  @MinLength(6, { message: 'Old password must be at least 6 characters long.' })
  @MaxLength(128, { message: 'Old password must be at most 128 characters long.' })
  oldPassword: string

  @ApiProperty({
    description: 'The new password of the user',
    example: 'newPassword456!',
  })
  @IsString({ message: 'New password must be a string.' })
  @MinLength(6, { message: 'New password must be at least 6 characters long.' })
  @MaxLength(128, { message: 'New password must be at most 128 characters long.' })
 
  newPassword: string
}