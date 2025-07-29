import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsUUID } from 'class-validator'

export class DeleteFileDto {
  @ApiProperty({
    description: 'Array of file IDs to delete',
    type: [String],
    example: ['uuid1', 'uuid2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  fileIds: string[]
}
