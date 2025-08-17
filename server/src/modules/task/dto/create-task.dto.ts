import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsUUID,
  IsPositive,
  IsDateString,
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
  @IsArray()
  links?: string[]

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

  @ApiPropertyOptional({
    description: 'Due date field 1 - array of dates for task deadlines',
    type: [String],
    example: ['2024-12-31T23:59:59.000Z', '2025-01-15T12:00:00.000Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  duedate1?: string[]

  @ApiPropertyOptional({
    description: 'Due date field 2 - array of dates for task deadlines',
    type: [String],
    example: ['2024-12-31T23:59:59.000Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  duedate2?: string[]

  @ApiPropertyOptional({
    description: 'Due date field 3 - array of dates for task deadlines',
    type: [String],
    example: ['2024-12-31T23:59:59.000Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  duedate3?: string[]

  @ApiPropertyOptional({
    description: 'Due date field 4 - array of dates for task deadlines',
    type: [String],
    example: ['2024-12-31T23:59:59.000Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  duedate4?: string[]

  @ApiPropertyOptional({
    description: 'Due date field 5 - array of dates for task deadlines',
    type: [String],
    example: ['2024-12-31T23:59:59.000Z'],
  })
  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  duedate5?: string[]
}
