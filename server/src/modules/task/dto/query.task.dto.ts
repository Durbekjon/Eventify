import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator'

class SearchFilter {
  @ApiProperty({
    example: 'title',
    description: 'Filter key (e.g. title, status)',
  })
  key: string

  @ApiProperty({ example: 'urgent', description: 'Filter value for the key' })
  value: string
}

export class TaskQueryDto {
  @ApiProperty({
    description: 'Search filter list: key/value pairs',
    type: [SearchFilter],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchFilter)
  search?: SearchFilter[]

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
