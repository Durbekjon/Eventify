-- AlterTable
ALTER TABLE "company_subscriptions" ADD COLUMN     "stripe_subscription_id" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "error_code" TEXT,
ADD COLUMN     "error_message" TEXT;
