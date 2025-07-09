import { ApiProperty } from '@nestjs/swagger'

export class TaskQueryDto {
  @ApiProperty({ description: 'The name of the task', required: false })
  name?: string

  @ApiProperty({ description: 'The status of the task', required: false })
  status?: string

  @ApiProperty({ description: 'The priority of the task', required: false })
  priority?: string

  @ApiProperty({ description: 'Minimum price of the task', required: false })
  minPrice?: number

  @ApiProperty({ description: 'Maximum price of the task', required: false })
  maxPrice?: number

  @ApiProperty({
    description: 'Indicates whether the task is paid',
    required: false,
  })
  paid?: boolean // Change from number to boolean

  @ApiProperty({ description: 'Filter for new tasks', required: true })
  new: boolean

  @ApiProperty({
    description: 'The page number for pagination',
    default: 1,
    required: true,
  })
  page: number = 1 // Default value

  @ApiProperty({
    description: 'Number of items per page',
    default: 12,
    required: true,
  })
  limit: number = 12 // Default value
}
