import { IsString, IsInt, isUUID, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateSheetDto {
  @ApiProperty({
    description: 'Sheet name',
    example: 'Task Sheet',
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'Workspace uuid',
  })
  @IsUUID()
  workspaceId: string
}
