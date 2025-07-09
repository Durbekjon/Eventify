import { ApiProperty } from '@nestjs/swagger'

export class WorkspaceReorderDto {
  @ApiProperty({ description: 'Workpsace ids' })
  workspaceIds: string[]
  @ApiProperty({ description: 'New orders' })
  orders: number[]
}
