import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  IsUrl,
  IsPositive,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateTaskDto {
  @ApiPropertyOptional({
    description: 'The name of the task',
  })
  @IsString()
  name: string

  @ApiPropertyOptional({
    description: 'The status of the task',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({
    description: 'Members assigned to the task',
    type: [String],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  members?: string[]

  @ApiPropertyOptional({
    description: 'The priority of the task',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  priority?: string

  @ApiPropertyOptional({
    description: 'A link associated with the task',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  link?: string

  @ApiPropertyOptional({
    description: 'Price associated with the task',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number

  @ApiPropertyOptional({ description: 'Is the task paid?', nullable: true })
  @IsOptional()
  @IsBoolean()
  paid?: boolean

  @ApiProperty({ description: 'ID of the sheet to which the task belongs' })
  @IsUUID()
  sheetId: string
}
