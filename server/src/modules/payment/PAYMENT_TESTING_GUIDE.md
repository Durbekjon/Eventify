# Payment System Testing Guide

## Overview

This guide provides comprehensive testing instructions for the payment system endpoints, with a focus on the confirm payment intent functionality.

## Payment Flow

1. **Create Payment Intent** (`POST /v1/payment/inline`)
2. **Process Payment** (Frontend with Stripe Elements)
3. **Confirm Payment Intent** (`POST /v1/payment/inline/confirm`)

## Testing Scenarios

### 1. Successful Payment Flow

#### Step 1: Create Payment Intent

```bash
curl -X POST http://localhost:3000/v1/payment/inline \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**

```json
{
  "clientSecret": "pi_3OqF2d2eZvKYlo2C1gF12345_secret_abcdefghijklmnop",
  "paymentIntentId": "pi_3OqF2d2eZvKYlo2C1gF12345"
}
```

#### Step 2: Process Payment (Frontend)

Use the `clientSecret` with Stripe Elements to process the payment.

#### Step 3: Confirm Payment Intent

```bash
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_3OqF2d2eZvKYlo2C1gF12345"
  }'
```

**Expected Response:**

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

### 2. Error Scenarios

#### Invalid Payment Intent ID Format

```bash
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "invalid_id"
  }'
```

**Expected Response (422):**

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

#### Payment Intent Not Found

```bash
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_nonexistent12345"
  }'
```

**Expected Response (404):**

```json
{
  "statusCode": 404,
  "message": "Payment intent not found",
  "error": "PAYMENT_INTENT_NOT_FOUND",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

#### Payment Intent Already Confirmed

```bash
# Try to confirm the same payment intent twice
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_already_confirmed12345"
  }'
```

**Expected Response (400):**

```json
{
  "statusCode": 400,
  "message": "Payment intent already confirmed",
  "error": "PAYMENT_INTENT_ALREADY_CONFIRMED",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

#### Payment Intent Failed

```bash
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_failed_payment12345"
  }'
```

**Expected Response (400):**

```json
{
  "statusCode": 400,
  "message": "Payment failed: requires_payment_method",
  "error": "PAYMENT_FAILED",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

### 3. Authentication Errors

#### Missing Authorization Header

```bash
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_3OqF2d2eZvKYlo2C1gF12345"
  }'
```

**Expected Response (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

#### Invalid JWT Token

```bash
curl -X POST http://localhost:3000/v1/payment/inline/confirm \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_3OqF2d2eZvKYlo2C1gF12345"
  }'
```

**Expected Response (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED",
  "retryable": false,
  "timestamp": "2025-07-30T21:00:00.000Z"
}
```

## Testing with Stripe Test Cards

### Successful Payment Cards

- **Visa**: `4242424242424242`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`

### Failed Payment Cards

- **Declined Card**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Expired Card**: `4000000000000069`
- **Incorrect CVC**: `4000000000000127`

## Swagger UI Testing

1. **Access Swagger UI**: Navigate to `http://localhost:3000/api`
2. **Authenticate**: Click "Authorize" and enter your JWT token
3. **Test Endpoints**: Use the interactive documentation to test payment endpoints

### Swagger Testing Steps

1. **Create Payment Intent**:
   - Go to `POST /v1/payment/inline`
   - Click "Try it out"
   - Enter valid plan ID
   - Execute request
   - Copy the `paymentIntentId` from response

2. **Confirm Payment Intent**:
   - Go to `POST /v1/payment/inline/confirm`
   - Click "Try it out"
   - Enter the `paymentIntentId` from step 1
   - Execute request
   - Verify successful response

## Error Code Reference

| Error Code                         | Description                             | HTTP Status | Retryable |
| ---------------------------------- | --------------------------------------- | ----------- | --------- |
| `PAYMENT_INTENT_NOT_FOUND`         | Payment intent does not exist           | 404         | No        |
| `PAYMENT_INTENT_ALREADY_CONFIRMED` | Payment intent already confirmed        | 400         | No        |
| `PAYMENT_INTENT_FAILED`            | Payment intent failed                   | 400         | No        |
| `PAYMENT_PROCESSING_FAILED`        | General payment processing error        | 500         | Yes       |
| `PLAN_NOT_FOUND`                   | Plan does not exist                     | 404         | No        |
| `ACTIVE_SUBSCRIPTION_EXISTS`       | Company already has active subscription | 400         | No        |
| `INSUFFICIENT_PERMISSIONS`         | User lacks required permissions         | 403         | No        |

## Best Practices

1. **Always validate payment intent status** before confirming
2. **Handle all error scenarios** in your frontend
3. **Use proper error handling** with retry logic for retryable errors
4. **Test with Stripe test cards** before going to production
5. **Monitor payment logs** for debugging issues
6. **Implement proper logging** for payment events

## Monitoring and Debugging

### Health Check

```bash
curl -X GET http://localhost:3000/v1/payment/health
```

### Metrics

```bash
curl -X GET http://localhost:3000/v1/payment/metrics
```

### Status

```bash
curl -X GET http://localhost:3000/v1/payment/status
```

## Common Issues and Solutions

1. **Payment Intent Not Found**: Ensure the payment intent ID is correct and exists in Stripe
2. **Validation Errors**: Check that payment intent ID follows Stripe format (`pi_` prefix)
3. **Authentication Errors**: Verify JWT token is valid and not expired
4. **Permission Errors**: Ensure user has AUTHOR role in the company
5. **Network Errors**: Check Stripe API connectivity and webhook configuration
