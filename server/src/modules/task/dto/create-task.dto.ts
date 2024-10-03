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
    description: 'The status of the task',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  status: string | null

  @ApiPropertyOptional({
    description: 'Members assigned to the task',
    type: [String],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  members: null | string[]

  @ApiPropertyOptional({
    description: 'The priority of the task',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  priority: string | null

  @ApiPropertyOptional({
    description: 'A link associated with the task',
    nullable: true,
  })
  @IsOptional()
  @IsUrl()
  link: string | null

  @ApiPropertyOptional({
    description: 'Price associated with the task',
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price: number | null

  @ApiPropertyOptional({ description: 'Is the task paid?', nullable: true })
  @IsOptional()
  @IsBoolean()
  paid: boolean | null

  @ApiProperty({ description: 'ID of the sheet to which the task belongs' })
  @IsUUID()
  sheetId: string

  @ApiProperty({ description: 'ID of the workspace to which the task belongs' })
  @IsUUID()
  workspaceId: string
}
