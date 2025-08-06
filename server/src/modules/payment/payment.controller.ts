import { JwtAuthGuard } from '@guards/jwt-auth.guard'
import { WebhookGuard } from '@guards/webhook.guard'
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'
import { PaymentService } from './payment.service'
import { PaymentHealthService } from './payment-health.service'
import { IUser } from '@user/dto/IUser'
import { CreatePaymentDto } from './dto/create-payment.dto'
import {
  ConfirmPaymentIntentDto,
  ConfirmPaymentIntentResponseDto,
} from './dto/confirm-payment.dto'
import {
  PaymentErrorResponseDto,
  PaymentValidationErrorDto,
} from './dto/payment-error.dto'
import { User } from '@decorators/user.decorator'
import { Request, Response } from 'express'

// Core DTOs for inline payments
export class InlinePaymentIntentResponseDto {
  clientSecret: string
  paymentIntentId: string
}

export class PaymentHealthResponseDto {
  status: string
  timestamp: string
  checks: Record<string, any>
}

@ApiTags('Payment')
@Controller({ path: 'payment', version: '1' })
export class PaymentController {
  constructor(
    private readonly service: PaymentService,
    private readonly healthService: PaymentHealthService,
  ) {}

  @Post('inline')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create Inline Payment Intent',
    description:
      'Creates a payment intent for inline/embedded payment form. Use this for embedded Stripe Elements instead of redirect-based checkout. This endpoint creates a payment intent that can be used with Stripe Elements to process payments directly in your frontend. The user must have AUTHOR role in the company.',
    tags: ['Payment'],
  })
  @ApiBody({
    type: CreatePaymentDto,
    description:
      'Payment intent creation parameters - plan ID for the subscription to purchase',
    schema: {
      example: {
        planId: '550e8400-e29b-41d4-a716-446655440000',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    type: InlinePaymentIntentResponseDto,
    schema: {
      example: {
        clientSecret: 'pi_3OqF2d2eZvKYlo2C1gF12345_secret_abcdefghijklmnop',
        paymentIntentId: 'pi_3OqF2d2eZvKYlo2C1gF12345',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid plan ID, active subscription exists, or insufficient permissions',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        message: 'Active subscription already exists',
        error: 'ACTIVE_SUBSCRIPTION_EXISTS',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not an AUTHOR role in the company',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden - insufficient permissions',
        error: 'INSUFFICIENT_PERMISSIONS',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - plan does not exist',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        message: 'Plan not found',
        error: 'PLAN_NOT_FOUND',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error - invalid plan ID format',
    type: PaymentValidationErrorDto,
    schema: {
      example: {
        statusCode: 422,
        message: 'Validation failed',
        errors: [
          {
            field: 'planId',
            message: 'planId must be a UUID',
            value: 'invalid_plan_id',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe API error or database error',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 500,
        message: 'Payment processing failed',
        error: 'PAYMENT_PROCESSING_FAILED',
        retryable: true,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  createInlinePayment(@User() user: IUser, @Body() body: CreatePaymentDto) {
    return this.service.createInlinePayment(user, body)
  }

  @Post('inline/confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Confirm Inline Payment Intent',
    description:
      'Confirms a payment intent after successful payment processing. This creates the subscription and activates the plan. Call this endpoint after the frontend has successfully processed the payment with Stripe Elements. The payment intent must be in "succeeded" status for confirmation to be successful.',
    tags: ['Payment'],
  })
  @ApiBody({
    type: ConfirmPaymentIntentDto,
    description:
      'Payment intent confirmation request with Stripe payment intent ID',
    schema: {
      example: {
        paymentIntentId: 'pi_3OqF2d2eZvKYlo2C1gF12345',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Payment intent confirmed successfully - subscription created and activated',
    type: ConfirmPaymentIntentResponseDto,
    schema: {
      example: {
        status: 'SUCCESS',
        message: 'Payment confirmed successfully',
        details: {
          subscriptionId: 'sub_1234567890',
          transactionId: 'txn_1234567890',
          amount: 2900,
          currency: 'usd',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - payment intent not found, already confirmed, payment failed, or invalid payment intent ID format',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        message: 'Payment intent not found',
        error: 'PAYMENT_INTENT_NOT_FOUND',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'UNAUTHORIZED',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - payment intent does not exist in Stripe',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        message: 'Payment intent not found',
        error: 'PAYMENT_INTENT_NOT_FOUND',
        retryable: false,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation error - invalid payment intent ID format',
    type: PaymentValidationErrorDto,
    schema: {
      example: {
        statusCode: 422,
        message: 'Validation failed',
        errors: [
          {
            field: 'paymentIntentId',
            message:
              'Payment intent ID must be a valid Stripe payment intent ID starting with "pi_"',
            value: 'invalid_id',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe API error or database error',
    type: PaymentErrorResponseDto,
    schema: {
      example: {
        statusCode: 500,
        message: 'Payment processing failed',
        error: 'PAYMENT_PROCESSING_FAILED',
        retryable: true,
        timestamp: '2025-07-30T21:00:00.000Z',
      },
    },
  })
  confirmInlinePayment(@Body() body: ConfirmPaymentIntentDto) {
    return this.service.confirmInlinePayment(body.paymentIntentId)
  }

  @Post('webhook')
  @UseGuards(WebhookGuard)
  @ApiOperation({
    summary: 'Stripe Webhook Handler',
    description:
      'Handles incoming webhooks from Stripe for payment events like subscription updates, payment success/failure, etc. This endpoint is called by Stripe.',
    tags: ['Payment'],
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid webhook signature or data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid webhook signature',
  })
  async handleWebhook(@Req() request: Request, @Res() response: Response) {
    try {
      const event = request['stripeEvent']
      await this.service.handleWebhookEvent(event)
      response.status(200).send()
    } catch (error) {
      console.error('Webhook error:', error)
      response.status(400).send()
    }
  }

  @Get('health')
  @ApiOperation({
    summary: 'Payment System Health Check',
    description:
      'Checks the overall health of the payment system including Stripe connectivity, database connections, webhook status, and subscription health.',
    tags: ['Payment Health'],
  })
  @ApiResponse({
    status: 200,
    description: 'Payment system health status retrieved successfully',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-07-30T21:00:00.000Z',
        checks: {
          stripe: { status: 'healthy' },
          database: { status: 'healthy' },
          webhooks: { status: 'healthy' },
          subscriptions: { status: 'healthy' },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - health check failed',
  })
  async getHealth(): Promise<any> {
    return this.healthService.checkPaymentSystemHealth()
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Payment System Metrics',
    description:
      'Retrieves detailed metrics about the payment system including transaction counts, success rates, revenue data, and system performance indicators.',
    tags: ['Payment Health'],
  })
  @ApiResponse({
    status: 200,
    description: 'Payment system metrics retrieved successfully',
    schema: {
      example: {
        totalTransactions: 150,
        successfulTransactions: 142,
        failedTransactions: 8,
        totalRevenue: 4350.0,
        averageTransactionValue: 29.0,
        monthlyRecurringRevenue: 2900.0,
        activeSubscriptions: 100,
        systemUptime: 99.9,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - metrics retrieval failed',
  })
  async getMetrics(): Promise<any> {
    return this.healthService.getPaymentSystemMetrics()
  }

  @Get('status')
  @ApiOperation({
    summary: 'Comprehensive Payment System Status',
    description:
      'Provides a comprehensive overview of the payment system status including health checks, metrics, recent errors, and system recommendations.',
    tags: ['Payment Health'],
  })
  @ApiResponse({
    status: 200,
    description: 'Payment system status retrieved successfully',
    schema: {
      example: {
        overallStatus: 'healthy',
        lastUpdated: '2025-07-30T21:00:00.000Z',
        health: {
          status: 'healthy',
          checks: {
            /* health check details */
          },
        },
        metrics: {
          totalTransactions: 150,
          successRate: 94.7,
        },
        recentErrors: [],
        recommendations: ['System operating normally'],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - status retrieval failed',
  })
  async getStatus(): Promise<any> {
    return this.healthService.getPaymentSystemStatus()
  }

  @Get('test-page')
  @ApiOperation({
    summary: 'Payment Testing Page',
    description: 'Redirects to the payment testing HTML page',
    tags: ['Payment Test'],
  })
  @ApiResponse({
    status: 200,
    description: 'Payment testing page information',
    schema: {
      example: {
        message: 'Payment testing page is available',
        url: 'http://localhost:4000/payment-test.html',
        description: 'Comprehensive payment system testing interface',
      },
    },
  })
  getTestPage() {
    return {
      message: 'Payment testing page is available',
      url: 'http://localhost:4000/payment-test.html',
      description:
        'Comprehensive payment system testing interface with Stripe integration',
      features: [
        'Create payment intents',
        'Process payments with Stripe Elements',
        'Confirm payment intents',
        'Test error scenarios',
        'API health checks',
      ],
    }
  }
}
