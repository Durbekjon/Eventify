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
import { User } from '@decorators/user.decorator'
import { Request, Response } from 'express'

// Core DTOs for inline payments
export class InlinePaymentIntentResponseDto {
  clientSecret: string
  paymentIntentId: string
}

export class ConfirmPaymentIntentDto {
  paymentIntentId: string
}

export class ConfirmPaymentIntentResponseDto {
  status: string
  message: string
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
      'Creates a payment intent for inline/embedded payment form. Use this for embedded Stripe Elements instead of redirect-based checkout. This endpoint creates a payment intent that can be used with Stripe Elements to process payments directly in your frontend.',
    tags: ['Payment'],
  })
  @ApiBody({
    type: CreatePaymentDto,
    description:
      'Payment intent creation parameters - plan and company information',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    type: InlinePaymentIntentResponseDto,
    schema: {
      example: {
        clientSecret: 'pi_1234567890_secret_abcdefghijklmnop',
        paymentIntentId: 'pi_1234567890',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid plan ID, active subscription exists, or insufficient permissions',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not an AUTHOR role in the company',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe API error or database error',
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
      'Confirms a payment intent after successful payment processing. This creates the subscription and activates the plan. Call this endpoint after the frontend has successfully processed the payment with Stripe Elements.',
    tags: ['Payment'],
  })
  @ApiBody({
    type: ConfirmPaymentIntentDto,
    description: 'Payment intent confirmation request',
    schema: {
      example: {
        paymentIntentId: 'pi_1234567890',
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
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - payment intent not found, already confirmed, or payment failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - payment intent does not exist',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Stripe API error or database error',
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
}
