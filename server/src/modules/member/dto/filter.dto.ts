import { ApiProperty } from '@nestjs/swagger'
import { MemberStatus, MemberTypes } from '@prisma/client'

export class FilterDto {
  @ApiProperty({ enum: MemberTypes, required: false })
  type: MemberTypes
  @ApiProperty({ enum: MemberStatus, required: false })
  status: MemberStatus

  @ApiProperty({ required: false, default: 1 })
  page: number = 1

  @ApiProperty({ required: false, default: 4 })
  limit: number = 4
}
