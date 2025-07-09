import { IsString, IsInt } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateSheetDto {
  @ApiProperty({
    description: 'Sheet name',
    example: 'Task Sheet',
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'Sheet order',
  })
  @IsInt()
  order: number
}
