import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ColumnType } from '@prisma/client'

export class UpdateColumnDto {
  @ApiPropertyOptional({
    description: 'The name of the column',
  })
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional({
    description: 'Whether the column should be shown',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  show?: boolean

  @ApiPropertyOptional({
    enum: ColumnType,
    description: 'The type of the column',
  })
  @IsOptional()
  type?: ColumnType

  @ApiPropertyOptional({
    description: 'select id',
  })
  @IsOptional()
  selectedId?: string
}
