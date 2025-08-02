import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class CreatePaymentDto {
  @ApiProperty({
    description: 'The unique identifier of the subscription plan to purchase',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
    type: 'string',
    format: 'uuid'
  })
  @IsUUID()
  planId: string
}
