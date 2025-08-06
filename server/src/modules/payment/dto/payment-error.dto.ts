import { ApiProperty } from '@nestjs/swagger'

export class PaymentErrorResponseDto {
  @ApiProperty({
    description: 'Error status code',
    example: 400,
    type: 'number'
  })
  statusCode: number

  @ApiProperty({
    description: 'Error message',
    example: 'Payment intent not found',
    type: 'string'
  })
  message: string

  @ApiProperty({
    description: 'Error code for programmatic handling',
    example: 'PAYMENT_INTENT_NOT_FOUND',
    type: 'string'
  })
  error: string

  @ApiProperty({
    description: 'Whether the error is retryable',
    example: false,
    type: 'boolean'
  })
  retryable: boolean

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2025-07-30T21:00:00.000Z',
    type: 'string',
    format: 'date-time'
  })
  timestamp: string

  @ApiProperty({
    description: 'Request ID for tracking',
    example: 'req_1234567890',
    type: 'string',
    required: false
  })
  requestId?: string
}

export class PaymentValidationErrorDto {
  @ApiProperty({
    description: 'Error status code',
    example: 400,
    type: 'number'
  })
  statusCode: number

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
    type: 'string'
  })
  message: string

  @ApiProperty({
    description: 'Validation errors',
    example: [
      {
        field: 'paymentIntentId',
        message: 'Payment intent ID must be a valid Stripe payment intent ID starting with "pi_"',
        value: 'invalid_id'
      }
    ],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        message: { type: 'string' },
        value: { type: 'string' }
      }
    }
  })
  errors: Array<{
    field: string
    message: string
    value: string
  }>
} 