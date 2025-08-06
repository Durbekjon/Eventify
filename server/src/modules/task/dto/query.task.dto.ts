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

class SearchFilter {
  @ApiProperty({
    example: 'name',
    description:
      'Filter key (e.g. name, status, priority, text1, number1, etc.)',
    enum: [
      'name',
      'status',
      'priority',
      'link',
      'price',
      'paid',
      'text1',
      'text2',
      'text3',
      'text4',
      'text5',
      'number1',
      'number2',
      'number3',
      'number4',
      'number5',
      'checkbox1',
      'checkbox2',
      'checkbox3',
      'checkbox4',
      'checkbox5',
      'select1',
      'select2',
      'select3',
      'select4',
      'select5',
      'date1',
      'date2',
      'date3',
      'date4',
      'date5',
      'link1',
      'link2',
      'link3',
      'link4',
      'link5',
    ],
  })
  @IsString()
  @IsIn([
    'name',
    'status',
    'priority',
    'link',
    'price',
    'paid',
    'text1',
    'text2',
    'text3',
    'text4',
    'text5',
    'number1',
    'number2',
    'number3',
    'number4',
    'number5',
    'checkbox1',
    'checkbox2',
    'checkbox3',
    'checkbox4',
    'checkbox5',
    'select1',
    'select2',
    'select3',
    'select4',
    'select5',
    'date1',
    'date2',
    'date3',
    'date4',
    'date5',
    'link1',
    'link2',
    'link3',
    'link4',
    'link5',
  ])
  key: string

  @ApiProperty({
    example: 'task',
    description:
      'Filter value for the key. For numbers use numeric values, for booleans use "true"/"false" or 1/0, for dates use ISO date strings.',
  })
  @IsString()
  value: string
}

@ApiExtraModels(SearchFilter)
export class TaskQueryDto {
  @ApiProperty({
    description: 'Search filters for tasks',
    required: false,
    isArray: true,
    type: 'array',
    items: { $ref: getSchemaPath(SearchFilter) },
    example: [
      { key: 'name', value: 'task' },
      { key: 'status', value: 'open' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SearchFilter)
  @Transform(({ value }) => {
    // Handle multiple ?search=... parameters
    if (Array.isArray(value)) {
      return value.map((v) => {
        try {
          return JSON.parse(v)
        } catch {
          return v
        }
      })
    }

    // Handle single search parameter
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return value
    }
  })
  search: SearchFilter[] = []

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
