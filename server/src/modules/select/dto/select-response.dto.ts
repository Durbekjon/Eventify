import { ApiProperty } from '@nestjs/swagger'

export class SelectResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string

  @ApiProperty({ example: 'Select title' })
  title: string

  @ApiProperty({ example: 'Select color' })
  color: string

  @ApiProperty({ example: 'company uuid' })
  companyId: string
}

export class DeleteResponseDto {
  @ApiProperty({ example: 'Delete successful' })
  message: string

  @ApiProperty({ example: true })
  success: boolean
}

export class UpdateSelectResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string

  @ApiProperty({ example: 'Select title' })
  title: string

  @ApiProperty({ example: 'Select color' })
  color: string

  @ApiProperty({ example: 'company uuid' })
  companyId: string
}
