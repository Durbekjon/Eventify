import { ApiProperty } from '@nestjs/swagger'

export class SheetReorderDto {
  @ApiProperty({ description: 'Sheet ids' })
  sheetIds: string[]
  @ApiProperty({ description: 'New orders' })
  orders: number[]
}
