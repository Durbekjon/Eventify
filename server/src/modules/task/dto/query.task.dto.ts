import { ApiProperty, ApiExtraModels, getSchemaPath } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsString,
  IsIn,
} from 'class-validator'

export class TaskQueryDto {
  @ApiProperty({
    description: 'Filter by task status',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({
    description: 'Order',
    required: false,
    enum: ['asc', 'desc'],
    type: String,
    default: 'asc',
  })
  order: 'asc' | 'desc' = 'asc'

  @ApiProperty({
    description: 'The page number for pagination',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1

  @ApiProperty({
    description: 'Number of items per page',
    default: 12,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number = 12
}
