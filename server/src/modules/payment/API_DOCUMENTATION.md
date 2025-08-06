# Payment API Documentation

## Overview

The Payment API provides endpoints for creating and confirming payment intents for subscription purchases. The system uses Stripe for payment processing and supports inline/embedded payment forms.

## Base URL

```
http://localhost:3000/v1/payment
```

## Authentication

All payment endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Endpoints

### 1. Create Inline Payment Intent

**Endpoint:** `POST /v1/payment/inline`

**Description:** Creates a payment intent for inline/embedded payment processing using Stripe Elements.

**Request Body:**

```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201):**

```json
{
  "clientSecret": "pi_3OqF2d2eZvKYlo2C1gF12345_secret_abcdefghijklmnop",
  "paymentIntentId": "pi_3OqF2d2eZvKYlo2C1gF12345"
}
```

**Error Responses:**

- **400 Bad Request** - Active subscription exists

```json
{
  "statusCode": 400,
  "message": "Active subscription already exists",
  "error": "ACTIVE_SUBSCRIPTION_EXISTS",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **401 Unauthorized** - Invalid or missing token

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **403 Forbidden** - Insufficient permissions

```json
{
  "statusCode": 403,
  "message": "Forbidden - insufficient permissions",
  "error": "INSUFFICIENT_PERMISSIONS",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **404 Not Found** - Plan not found

```json
{
  "statusCode": 404,
  "message": "Plan not found",
  "error": "PLAN_NOT_FOUND",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **422 Validation Error** - Invalid plan ID format

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "planId",
      "message": "planId must be a UUID",
      "value": "invalid_plan_id"
    }
  ]
}
```

### 2. Confirm Inline Payment Intent

**Endpoint:** `POST /v1/payment/inline/confirm`

**Description:** Confirms a payment intent after successful payment processing and creates the subscription.

**Request Body:**

```json
{
  "paymentIntentId": "pi_3OqF2d2eZvKYlo2C1gF12345"
}
```

**Response (200):**

```json
{
  "status": "SUCCESS",
  "message": "Payment confirmed successfully",
  "details": {
    "subscriptionId": "sub_1234567890",
    "transactionId": "txn_1234567890",
    "amount": 2900,
    "currency": "usd"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Payment intent not found or failed

```json
{
  "statusCode": 400,
  "message": "Payment intent not found",
  "error": "PAYMENT_INTENT_NOT_FOUND",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **401 Unauthorized** - Invalid or missing token

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **404 Not Found** - Payment intent does not exist in Stripe

```json
{
  "statusCode": 404,
  "message": "Payment intent not found",
  "error": "PAYMENT_INTENT_NOT_FOUND",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

- **422 Validation Error** - Invalid payment intent ID format

```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "paymentIntentId",
      "message": "Payment intent ID must be a valid Stripe payment intent ID starting with \"pi_\"",
      "value": "invalid_id"
    }
  ]
}
```

### 3. Payment Health Check

**Endpoint:** `GET /v1/payment/health`

**Description:** Checks the overall health of the payment system.

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-07-30T21:00:00.000Z",
  "checks": {
    "stripe": { "status": "healthy" },
    "database": { "status": "healthy" },
    "webhooks": { "status": "healthy" },
    "subscriptions": { "status": "healthy" }
  }
}
```

### 4. Payment Metrics

**Endpoint:** `GET /v1/payment/metrics`

**Description:** Retrieves detailed metrics about the payment system.

**Response (200):**

```json
{
  "totalTransactions": 150,
  "successfulTransactions": 142,
  "failedTransactions": 8,
  "totalRevenue": 4350.0,
  "averageTransactionValue": 29.0,
  "monthlyRecurringRevenue": 2900.0,
  "activeSubscriptions": 100,
  "systemUptime": 99.9
}
```

### 5. Payment Status

**Endpoint:** `GET /v1/payment/status`

**Description:** Provides comprehensive payment system status.

**Response (200):**

```json
{
  "overallStatus": "healthy",
  "lastUpdated": "2025-07-30T21:00:00.000Z",
  "health": {
    "status": "healthy",
    "checks": {
      "stripe": { "status": "healthy" },
      "database": { "status": "healthy" },
      "webhooks": { "status": "healthy" },
      "subscriptions": { "status": "healthy" }
    }
  },
  "metrics": {
    "totalTransactions": 150,
    "successRate": 94.7
  },
  "recentErrors": [],
  "recommendations": ["System operating normally"]
}
```

## Data Models

### CreatePaymentDto

```typescript
{
  planId: string // UUID of the subscription plan
}
```

### ConfirmPaymentIntentDto

```typescript
{
  paymentIntentId: string // Stripe payment intent ID (format: pi_*)
}
```

### ConfirmPaymentIntentResponseDto

```typescript
{
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
  details?: {
    subscriptionId?: string;
    transactionId?: string;
    amount?: number;
    currency?: string;
  };
}
```

### PaymentErrorResponseDto

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  retryable: boolean;
  timestamp: string;
  requestId?: string;
}
```

## Error Codes

| Code                               | Description                             | HTTP Status | Retryable |
| ---------------------------------- | --------------------------------------- | ----------- | --------- |
| `PAYMENT_INTENT_NOT_FOUND`         | Payment intent does not exist           | 404         | No        |
| `PAYMENT_INTENT_ALREADY_CONFIRMED` | Payment intent already confirmed        | 400         | No        |
| `PAYMENT_INTENT_FAILED`            | Payment intent failed                   | 400         | No        |
| `PAYMENT_PROCESSING_FAILED`        | General payment processing error        | 500         | Yes       |
| `PLAN_NOT_FOUND`                   | Plan does not exist                     | 404         | No        |
| `ACTIVE_SUBSCRIPTION_EXISTS`       | Company already has active subscription | 400         | No        |
| `INSUFFICIENT_PERMISSIONS`         | User lacks required permissions         | 403         | No        |
| `CARD_DECLINED`                    | Card was declined                       | 400         | No        |
| `INSUFFICIENT_FUNDS`               | Insufficient funds                      | 400         | Yes       |
| `EXPIRED_CARD`                     | Card has expired                        | 400         | No        |
| `INVALID_PAYMENT_METHOD`           | Invalid payment method                  | 400         | No        |

## Testing

### Prerequisites

1. Valid JWT token with AUTHOR role
2. Valid plan ID in the database
3. Stripe test environment configured

### Test Flow

1. Create payment intent with valid plan ID
2. Use client secret with Stripe Elements (frontend)
3. Confirm payment intent with payment intent ID
4. Verify subscription creation

### Test Cards

- **Success**: `4242424242424242` (Visa)
- **Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`

## Rate Limiting

- **Create Payment Intent**: 10 requests per minute per user
- **Confirm Payment Intent**: 20 requests per minute per user
- **Health/Metrics**: 60 requests per minute per IP

## Security

- All endpoints require JWT authentication
- Payment intent IDs are validated for Stripe format
- User must have AUTHOR role in the company
- Webhook signatures are verified for Stripe events
- Sensitive data is not logged

## Monitoring

- Payment success/failure rates
- Average transaction value
- System uptime and health
- Error tracking and alerting
- Subscription lifecycle monitoring
