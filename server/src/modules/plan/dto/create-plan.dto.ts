import { ApiProperty } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreatePlanDto {
  @ApiProperty({ description: 'Plan name' })
  @IsNotEmpty()
  name: string
  @ApiProperty({ description: 'Plan optional description' })
  @IsOptional()
  description: string | null

  @ApiProperty({ description: 'Plan price for a month' })
  @IsNumber()
  @IsNotEmpty()
  price: number
  @ApiProperty({ description: 'Maximum workspaces count' })
  @IsNumber()
  @IsNotEmpty()
  maxWorkspaces: number

  @ApiProperty({ description: 'Maximum sheets count' })
  @IsNumber()
  @IsNotEmpty()
  maxSheets: number
  @ApiProperty({ description: 'Maximum members count' })
  @IsNumber()
  @IsNotEmpty()
  maxMembers: number
  @ApiProperty({ description: 'Maximum viewers count' })
  @IsNumber()
  @IsNotEmpty()
  maxViewers: number
  @ApiProperty({ description: 'Maximum tasks count' })
  @IsNumber()
  @IsNotEmpty()
  maxTasks: number

  @ApiProperty({ description: 'Is customized plan' })
  @IsBoolean()
  @IsNotEmpty()
  isCustomized: boolean

  @ApiProperty({ description: 'Customized plan for users' })
  @IsOptional()
  @IsArray()
  customizedPlanFor: string[]

  @ApiProperty({ description: 'Plan tag' })
  @IsOptional()
  @IsString()
  tags?: string | null
}
