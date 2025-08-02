export const STRIPE = {
  SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  WEBHOOK_ENDPOINT: '/api/v1/payment/webhook',
}
