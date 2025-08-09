import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ColumnType } from '@prisma/client'
import { SelectCreateInput } from '@sheet/dto/create-sheet.dto'
import { Type } from 'class-transformer'

export class CreateColumnDto {
  @ApiProperty({
    description: 'Selects related to the column',
    type: [SelectCreateInput],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SelectCreateInput)
  selects?: SelectCreateInput[]

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
    description: 'The selected select for the column',
  })
  @IsOptional()
  selected?: string

  key?: string
}
