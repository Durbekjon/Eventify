import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'

export class QueryFilterDto {
  @ApiProperty({ required: true, default: 1, description: 'Page number' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page: number = 1
  @ApiProperty({ required: true, default: 10, description: 'Limit number' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit: number = 10
  @ApiProperty({ required: true, default: 'desc', description: 'Order by' })
  @IsEnum(['asc', 'desc'])
  orderBy: 'asc' | 'desc' = 'desc'

  @ApiProperty({ required: false, description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate: string | null = null
  @ApiProperty({ required: false, description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate: string | null = null
}
