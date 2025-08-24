import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsNumber, IsArray } from 'class-validator'

export class ReorderColumnDto {
  @ApiProperty({
    description: 'The IDs of the columns to reorder',
    type: [String],
    example: [
      'c94948db-f38f-47f5-8fae-95db44be3288',
      '21228730-3834-47f5-82fc-a6d1d2240c47',
    ],
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  columnIds: string[]

  @ApiProperty({
    description: 'The new orders of the columns',
    type: [Number],
    example: [2, 1],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty({ each: true })
  orders: number[]
}
