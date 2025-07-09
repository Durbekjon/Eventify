import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ColumnType } from '@prisma/client'

class Option {
  @ApiProperty({ description: 'Option name', example: 'High Priority' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Option color', example: '#fff' })
  @IsString()
  color: string
}

class SelectCreateInput {
  @ApiProperty({
    description: 'Title of the select input',
    example: 'Priority',
  })
  @IsString()
  title: string

  @ApiProperty({
    description: 'Color associated with the select input',
    example: '#FF5733',
  })
  @IsString()
  color: string

  @ApiProperty({
    description: 'Options for the select input',
    type: [Option],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Option)
  options?: Option[]
}

class ColumnCreateInput {
  @ApiProperty({
    description: 'Selects related to the column',
    type: [SelectCreateInput],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SelectCreateInput)
  selects?: SelectCreateInput[]

  @ApiProperty({
    description: 'Column name',
    example: 'Status',
  })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({
    description: 'Visibility of the column',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  show?: boolean

  @ApiProperty({
    description: 'Column key identifier',
    example: 'status',
  })
  @IsString()
  @IsOptional()
  key?: string

  @ApiProperty({
    description: 'Column type',
    enum: ColumnType,
  })
  type: ColumnType
}

export class CreateSheetDto {
  @ApiProperty({
    description: 'Sheet name',
    example: 'Task Sheet',
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'Workspace UUID',
  })
  @IsUUID()
  workspaceId: string

  @ApiProperty({
    description: 'Columns',
    type: [ColumnCreateInput],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ColumnCreateInput)
  columns?: ColumnCreateInput[]
}
