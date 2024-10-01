import { ApiProperty } from '@nestjs/swagger'

export class SelectResponseDto {
  @ApiProperty({ example: '123' })
  id: string

  @ApiProperty({ example: 'Select Name' })
  name: string

  @ApiProperty({ example: 'Select Description' })
  description: string

  @ApiProperty({ example: '123' })
  companyId: string

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: Date
}

export class SelectsResponseDto {
  @ApiProperty({ type: [SelectResponseDto] })
  selects: SelectResponseDto[]
}

export class DeleteResponseDto {
  @ApiProperty({ example: 'Delete successful' })
  message: string

  @ApiProperty({ example: true })
  success: boolean
}

export class UpdateSelectResponseDto {
  @ApiProperty({ example: '123' })
  id: string

  @ApiProperty({ example: 'Updated Select Name' })
  name: string

  @ApiProperty({ example: 'Updated Select Description' })
  description: string
}
