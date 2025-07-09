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
import { ApiProperty } from '@nestjs/swagger'

export class UpdateTaskDto {
  @ApiProperty({ description: 'The name of the task', required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ description: 'The members of the task', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  members?: string[]

  @ApiProperty({
    description: 'The current status of the task',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string

  @ApiProperty({
    description: 'The priority level of the task',
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: string

  @ApiProperty({ description: 'A link related to the task', required: false })
  @IsOptional()
  @IsString()
  link?: string

  @ApiProperty({
    description: 'The price associated with the task',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number

  @ApiProperty({
    description: 'Indicates if the task is paid',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  paid?: boolean

  @ApiProperty({
    description: 'Text field 1 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  text1?: string

  @ApiProperty({
    description: 'Text field 2 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  text2?: string

  @ApiProperty({
    description: 'Text field 3 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  text3?: string

  @ApiProperty({
    description: 'Text field 4 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  text4?: string

  @ApiProperty({
    description: 'Text field 5 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  text5?: string

  @ApiProperty({
    description: 'Number field 1 for additional information',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  number1?: number

  @ApiProperty({
    description: 'Number field 2 for additional information',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  number2?: number

  @ApiProperty({
    description: 'Number field 3 for additional information',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  number3?: number

  @ApiProperty({
    description: 'Number field 4 for additional information',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  number4?: number

  @ApiProperty({
    description: 'Number field 5 for additional information',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  number5?: number

  @ApiProperty({
    description: 'Checkbox field 1 for additional information',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  checkbox1?: boolean

  @ApiProperty({
    description: 'Checkbox field 2 for additional information',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  checkbox2?: boolean

  @ApiProperty({
    description: 'Checkbox field 3 for additional information',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  checkbox3?: boolean

  @ApiProperty({
    description: 'Checkbox field 4 for additional information',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  checkbox4?: boolean

  @ApiProperty({
    description: 'Checkbox field 5 for additional information',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  checkbox5?: boolean

  @ApiProperty({
    description: 'Select field 1 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  select1?: string

  @ApiProperty({
    description: 'Select field 2 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  select2?: string

  @ApiProperty({
    description: 'Select field 3 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  select3?: string

  @ApiProperty({
    description: 'Select field 4 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  select4?: string

  @ApiProperty({
    description: 'Select field 5 for additional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  select5?: string

  @ApiProperty({
    description: 'Date field 1 for additional information',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date1?: string

  @ApiProperty({
    description: 'Date field 2 for additional information',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date2?: string

  @ApiProperty({
    description: 'Date field 3 for additional information',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date3?: string

  @ApiProperty({
    description: 'Date field 4 for additional information',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date4?: string

  @ApiProperty({
    description: 'Date field 5 for additional information',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date5?: string
}
