import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ColumnType } from '@prisma/client'

export class CreateColumnDto {
  @ApiPropertyOptional({
    description: 'The name of the column',
  })
  @IsOptional()
  @IsString()
  name?: string | null

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
  type: ColumnType

  @ApiProperty({ description: 'The sheet associated with the column' })
  @IsNotEmpty()
  sheetId: string

  @ApiPropertyOptional({
    description: 'The selects for the column',
    type: [String],
  })
  @IsOptional()
  selects?: string[]

  @ApiPropertyOptional({
    description: 'The selected select for the column',
  })
  @IsOptional()
  selected?: string

  key?: string
}
