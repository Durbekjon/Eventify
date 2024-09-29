import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class UpdateWorkspaceDto {
  @ApiProperty({ description: 'Workspace name' })
  @IsNotEmpty()
  name: string
  @ApiProperty({ description: 'Workspace order' })
  @IsNotEmpty()
  order: number
}
