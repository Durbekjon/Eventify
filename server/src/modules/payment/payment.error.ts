export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'PaymentError'
  }

  // Payment method errors
  static cardDeclined(message: string = 'Card was declined') {
    return new PaymentError(message, 'CARD_DECLINED', false, 400)
  }

  static insufficientFunds(message: string = 'Insufficient funds') {
    return new PaymentError(message, 'INSUFFICIENT_FUNDS', true, 400)
  }

  static expiredCard(message: string = 'Card has expired') {
    return new PaymentError(message, 'EXPIRED_CARD', false, 400)
  }

  static invalidPaymentMethod(message: string = 'Invalid payment method') {
    return new PaymentError(message, 'INVALID_PAYMENT_METHOD', false, 400)
  }

  // Network and system errors
  static networkError(message: string = 'Network error occurred') {
    return new PaymentError(message, 'NETWORK_ERROR', true, 500)
  }

  static paymentProcessingFailed(
    message: string = 'Payment processing failed',
  ) {
    return new PaymentError(message, 'PAYMENT_PROCESSING_FAILED', true, 500)
  }

  // Business logic errors
  static subscriptionNotFound(message: string = 'Subscription not found') {
    return new PaymentError(message, 'SUBSCRIPTION_NOT_FOUND', false, 404)
  }

  static planNotFound(message: string = 'Plan not found') {
    return new PaymentError(message, 'PLAN_NOT_FOUND', false, 404)
  }

  static activeSubscriptionExists(
    message: string = 'Active subscription already exists',
  ) {
    return new PaymentError(message, 'ACTIVE_SUBSCRIPTION_EXISTS', false, 400)
  }

  static usageLimitExceeded(message: string = 'Usage limit exceeded') {
    return new PaymentError(message, 'USAGE_LIMIT_EXCEEDED', false, 429)
  }

  static trialExpired(message: string = 'Trial period has expired') {
    return new PaymentError(message, 'TRIAL_EXPIRED', false, 400)
  }

  // Payment intent specific errors
  static paymentIntentNotFound(message: string = 'Payment intent not found') {
    return new PaymentError(message, 'PAYMENT_INTENT_NOT_FOUND', false, 404)
  }

  static paymentIntentAlreadyConfirmed(
    message: string = 'Payment intent already confirmed',
  ) {
    return new PaymentError(
      message,
      'PAYMENT_INTENT_ALREADY_CONFIRMED',
      false,
      400,
    )
  }

  static paymentIntentFailed(message: string = 'Payment intent failed') {
    return new PaymentError(message, 'PAYMENT_INTENT_FAILED', false, 400)
  }

  // Customer errors
  static customerNotFound(message: string = 'Customer not found') {
    return new PaymentError(message, 'CUSTOMER_NOT_FOUND', false, 404)
  }

  static customerCreationFailed(message: string = 'Failed to create customer') {
    return new PaymentError(message, 'CUSTOMER_CREATION_FAILED', true, 500)
  }

  // Validation errors
  static invalidPlanId(message: string = 'Invalid plan ID') {
    return new PaymentError(message, 'INVALID_PLAN_ID', false, 400)
  }

  static invalidAmount(message: string = 'Invalid payment amount') {
    return new PaymentError(message, 'INVALID_AMOUNT', false, 400)
  }

  static invalidCurrency(message: string = 'Invalid currency') {
    return new PaymentError(message, 'INVALID_CURRENCY', false, 400)
  }
}
