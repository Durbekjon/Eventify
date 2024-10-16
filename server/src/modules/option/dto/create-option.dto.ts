import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class CreateOptionDto {
  @ApiProperty({
    description: 'select id',
  })
  @IsString()
  @IsNotEmpty()
  selectId: string

  @ApiProperty({
    description: 'Name of the option',
    example: 'Option 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    description: 'Color of the option',
    example: '#fff',
  })
  @IsString()
  @IsNotEmpty()
  color: string
}
