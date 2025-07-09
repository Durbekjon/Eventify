import { ApiProperty } from '@nestjs/swagger'
import { IsArray } from 'class-validator'

export class SheetReorderDto {
  @ApiProperty({ description: 'Sheet ids' })
  @IsArray()
  sheetIds: string[]
  @ApiProperty({ description: 'New orders' })
  @IsArray()
  orders: number[]
}
