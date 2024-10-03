import { ApiProperty } from '@nestjs/swagger'

// response.dto.ts
export class TaskResponseDto {
  @ApiProperty({
    description: 'The unique identifier for the task',
    type: String,
  })
  id: string

  @ApiProperty({
    description: 'The current status of the task',
    type: String,
    nullable: true,
  })
  status: string | null

  @ApiProperty({
    description: 'The priority level of the task',
    type: String,
    nullable: true,
  })
  priority: string | null

  @ApiProperty({
    description: 'A link associated with the task',
    type: String,
    nullable: true,
  })
  link: string | null

  @ApiProperty({
    description: 'The price related to the task',
    type: Number,
    nullable: true,
  })
  price: number | null

  @ApiProperty({
    description: 'Whether the task has been paid',
    type: Boolean,
    nullable: true,
  })
  paid: boolean | null

  @ApiProperty({
    description: 'The date when the task was created',
    type: Date,
  })
  createdAt: Date

  @ApiProperty({
    description: 'The date when the task was last updated',
    type: Date,
  })
  updatedAt: Date

  @ApiProperty({
    description: 'List of members associated with the task',
    type: [String],
  })
  members: string[]

  @ApiProperty({
    description: 'The ID of the workspace to which the task belongs',
    type: String,
  })
  workspaceId: string

  @ApiProperty({
    description: 'The ID of the sheet to which the task belongs',
    type: String,
  })
  sheetId: string

  @ApiProperty({
    description: 'The ID of the company associated with the task',
    type: String,
  })
  companyId: string
}

// delete-task-response.dto.ts
export class DeleteTaskResponseDto {
  @ApiProperty({
    description: 'The status of the delete operation',
    type: String,
  })
  status: string

  @ApiProperty({
    description: 'The result message of the delete operation',
    type: String,
  })
  result: string
}
