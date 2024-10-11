import { ApiProperty } from '@nestjs/swagger'
import { ColumnType } from '@prisma/client'

export class CreateColumnResponseDto {
  @ApiProperty({ description: 'Unique ID of the column' })
  id: string

  @ApiProperty({ description: 'Column name' })
  name: string

  @ApiProperty({ description: 'Unique column key' })
  key: string

  @ApiProperty({ description: 'Column visibility' })
  show: boolean

  @ApiProperty({ description: 'Column type (e.g., text, number, date)' })
  type: ColumnType

  @ApiProperty({ description: 'Sheet ID' })
  sheetId: string

  @ApiProperty({ description: 'Company ID' })
  companyId: string
}

export class UpdateColumnResponseDto {
  @ApiProperty({ description: 'Column ID' })
  id: string

  @ApiProperty({ description: 'Updated column name' })
  name: string

  @ApiProperty({ description: 'Column visibility' })
  show: boolean

  @ApiProperty({ description: 'Updated column type' })
  type: ColumnType

  @ApiProperty({ description: 'Sheet ID' })
  sheetId: string

  @ApiProperty({ description: 'Company ID' })
  companyId: string
}

export class DeleteColumnResponseDto {
  @ApiProperty({ description: 'Deletion status' })
  status: string

  @ApiProperty({ description: 'Deletion confirmation message' })
  result: string
}
