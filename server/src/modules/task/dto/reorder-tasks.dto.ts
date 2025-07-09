import { ApiProperty } from '@nestjs/swagger'

export class TaskReorderDto {
  @ApiProperty({ description: 'Task ids' })
  taskId: string[]
  @ApiProperty({ description: 'New orders' })
  orders: number[]
}
