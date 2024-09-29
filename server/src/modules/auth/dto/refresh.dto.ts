import { IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ReshreshTokenDto {
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'refresh-token' })
  refreshToken: string
}
