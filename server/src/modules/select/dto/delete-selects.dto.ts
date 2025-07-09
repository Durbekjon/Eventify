import { ApiProperty } from '@nestjs/swagger'
import { UUID } from 'crypto'

export class DeleteSelectsDto {
  @ApiProperty({ description: 'Selects ids' })
  ids: [UUID]
}
