import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class MoveTaskDto {
  @ApiProperty({
    description: 'The ID of the task to be moved',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  taskId: string

  @ApiProperty({
    description: 'The ID of the sheet to which the task will be moved',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  sheetId: string
}
