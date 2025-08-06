# Payment Testing Page

This directory contains a comprehensive HTML/JavaScript payment testing page for the Eventify payment system.

## Files

- `payment-test.html` - Main payment testing interface
- `README.md` - This documentation file

## How to Use

### 1. Access the Testing Page

Open the payment testing page in your browser:

```
http://localhost:4000/payment-test.html
```

### 2. Configuration

Before testing, configure the following:

1. **API Base URL**: Set to `http://localhost:4000/api/v1` (default)
2. **JWT Token**: Enter your valid JWT token
3. **Stripe Publishable Key**: Enter your Stripe test publishable key

### 3. Testing Flow

#### Step 1: Test Connection

- Click "🔗 Test Connection" to verify API connectivity
- This tests the `/payment/health` endpoint

#### Step 2: Create Payment Intent

- Enter a valid Plan ID (UUID format)
- Click "🚀 Create Payment Intent"
- This calls the `/payment/inline` endpoint

#### Step 3: Process Payment

- Select a test card from the dropdown
- The Stripe Elements card form will appear
- Click "💳 Process Payment" to process the payment with Stripe

#### Step 4: Confirm Payment Intent

- The Payment Intent ID will be auto-filled
- Click "✅ Confirm Payment Intent"
- This calls the `/payment/inline/confirm` endpoint

### 4. Test Cards

#### Successful Payments

- **Visa**: `4242424242424242`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`

#### Failed Payments

- **Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`
- **Expired Card**: `4000000000000069`
- **Incorrect CVC**: `4000000000000127`

### 5. Error Testing

The page includes several error testing scenarios:

- **Invalid Plan ID**: Tests validation errors
- **Invalid Payment Intent**: Tests invalid payment intent format
- **Unauthorized**: Tests authentication errors
- **Health Check**: Tests API health endpoint
- **Metrics**: Tests payment metrics endpoint
- **Status**: Tests payment status endpoint

## Features

### 🎨 Modern UI

- Responsive design with gradient backgrounds
- Loading animations and status indicators
- Color-coded results (success, error, info)

### 🔧 Configuration

- Easy API URL and JWT token configuration
- Stripe publishable key setup
- Auto-fill with common test values

### 📊 Real-time Results

- JSON-formatted response display
- Error handling with detailed messages
- Step-by-step progress tracking

### 🧪 Comprehensive Testing

- Complete payment flow testing
- Error scenario testing
- API health and metrics testing
- Stripe Elements integration

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure your API server allows requests from the testing page
2. **Stripe Key Issues**: Use a valid Stripe test publishable key
3. **JWT Token Expired**: Refresh your JWT token
4. **API Connection**: Verify the API server is running on the correct port

### Debug Information

- Check browser console for detailed error messages
- Verify network requests in browser developer tools
- Ensure all required fields are filled before testing

## Security Notes

- This is a testing page for development purposes only
- Never use production Stripe keys in testing
- JWT tokens should be test tokens, not production tokens
- The page includes your JWT token in the HTML - don't share this page publicly

## API Endpoints Tested

- `POST /v1/payment/inline` - Create payment intent
- `POST /v1/payment/inline/confirm` - Confirm payment intent
- `GET /v1/payment/health` - Health check
- `GET /v1/payment/metrics` - Payment metrics
- `GET /v1/payment/status` - Payment status

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Dependencies

- Stripe.js v3 (loaded from CDN)
- Modern browser with ES6+ support
- Fetch API support
