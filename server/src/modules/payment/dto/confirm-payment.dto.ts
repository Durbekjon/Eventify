import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, Matches } from 'class-validator'

export class ConfirmPaymentIntentDto {
  @ApiProperty({
    description: 'The Stripe payment intent ID to confirm',
    example: 'pi_3OqF2d2eZvKYlo2C1gF12345',
    required: true,
    type: 'string',
    pattern: '^pi_[a-zA-Z0-9_]+$',
    minLength: 10,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^pi_[a-zA-Z0-9_]+$/, {
    message: 'Payment intent ID must be a valid Stripe payment intent ID starting with "pi_"'
  })
  paymentIntentId: string
}

export class ConfirmPaymentIntentResponseDto {
  @ApiProperty({
    description: 'Status of the payment confirmation',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    type: 'string'
  })
  status: string

  @ApiProperty({
    description: 'Human-readable message about the payment confirmation result',
    example: 'Payment confirmed successfully',
    type: 'string'
  })
  message: string

  @ApiProperty({
    description: 'Additional details about the payment confirmation',
    example: {
      subscriptionId: 'sub_1234567890',
      transactionId: 'txn_1234567890',
      amount: 2900,
      currency: 'usd'
    },
    required: false,
    type: 'object'
  })
  details?: {
    subscriptionId?: string
    transactionId?: string
    amount?: number
    currency?: string
  }
} 