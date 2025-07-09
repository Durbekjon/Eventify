import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator'

export class UpdatePlanDto {
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
  @IsNotEmpty()
  @IsNotEmpty()
  maxWorkspaces: number

  @ApiProperty({ description: 'Maximum sheets count' })
  @IsNotEmpty()
  @IsNotEmpty()
  maxSheets: number
  @ApiProperty({ description: 'Maximum members count' })
  @IsNotEmpty()
  @IsNotEmpty()
  maxMembers: number
  @ApiProperty({ description: 'Maximum viewers count' })
  @IsNotEmpty()
  @IsNotEmpty()
  maxViewers: number
  @ApiProperty({ description: 'Optional Plan order' })
  @IsOptional()
  order: number
}
