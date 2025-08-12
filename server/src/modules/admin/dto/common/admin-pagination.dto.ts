import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class AdminPaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @ApiPropertyOptional({
    description: 'Sort field',
  })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc'
}

export class AdminFilterDto extends AdminPaginationDto {
  @ApiPropertyOptional({
    description: 'Search term',
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: 'Filter by date from (ISO string)',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string

  @ApiPropertyOptional({
    description: 'Filter by date to (ISO string)',
  })
  @IsOptional()
  @IsString()
  dateTo?: string

  @ApiPropertyOptional({
    description: 'Filter by status',
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({
    description: 'Filter by boolean flag',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  isActive?: boolean
}

export class AdminResponseDto<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  timestamp: string
}
