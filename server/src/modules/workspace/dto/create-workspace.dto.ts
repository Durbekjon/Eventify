import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'

export class CreateWorkspaceDto {
  @ApiProperty({ description: 'Workspace name' })
  @IsNotEmpty()
  name: string
}
