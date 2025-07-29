import { ApiProperty } from '@nestjs/swagger'

export class FileResponseDto {
  @ApiProperty({ description: 'File ID' })
  id: string

  @ApiProperty({ description: 'Unique filename' })
  filename: string

  @ApiProperty({ description: 'Original file name' })
  originalName: string

  @ApiProperty({ description: 'File MIME type' })
  mimeType: string

  @ApiProperty({ description: 'File size in bytes' })
  size: number

  @ApiProperty({ description: 'File path' })
  path: string

  @ApiProperty({ description: 'Upload date' })
  createdAt: Date

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date

  @ApiProperty({ description: 'User ID who uploaded the file' })
  uploadedBy: string

  @ApiProperty({ description: 'Company ID' })
  companyId: string

  @ApiProperty({
    description: 'Task ID (if attached to task)',
    required: false,
  })
  taskId?: string

  @ApiProperty({
    description: 'Sheet ID (if attached to sheet)',
    required: false,
  })
  sheetId?: string

  @ApiProperty({ description: 'File URL for access' })
  url: string
}
