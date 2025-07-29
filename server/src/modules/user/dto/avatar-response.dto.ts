import { ApiProperty } from '@nestjs/swagger'

export class AvatarResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string

  @ApiProperty({ description: 'Avatar file information' })
  avatar: {
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    createdAt: Date
    updatedAt: Date
  }
}
