import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The unique identifier of the plan',
  })
  @IsUUID()
  planId: string

  @ApiProperty({
    description: 'The unique identifier of the company',
  })
  @IsUUID()
  companyId: string
}
