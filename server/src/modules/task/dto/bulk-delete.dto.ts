import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class BulkDeleteDto {
  @ApiProperty({
    description: 'The IDs of the tasks to delete',
    type: [String],
    example: ['1', '2', '3'],
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  taskIds: string[]
}
