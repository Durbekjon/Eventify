import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import Stripe from 'stripe'
import { STRIPE } from '@consts/stripe'

@Injectable()
export class WebhookGuard implements CanActivate {
  private stripe: Stripe

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required')
    }
    
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia',
    })
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const signature = request.headers['stripe-signature'] as string

    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature')
    }

    if (!STRIPE.WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        request.body,
        signature,
        STRIPE.WEBHOOK_SECRET
      )
      
      // Attach the verified event to the request for use in the controller
      request['stripeEvent'] = event
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid Stripe signature')
    }
  }
} 