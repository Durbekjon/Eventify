import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsHexColor } from 'class-validator'

export class UpdateSelectDto {
  @ApiProperty({
    description: 'The value for the select option',
    required: false,
    type: String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  title: string | null

  @ApiProperty({
    description: 'Hex color code for the select option',
    example: '#ffffff',
  })
  @IsString()
  @IsHexColor()
  color: string
}
