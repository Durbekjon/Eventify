-- AlterTable
ALTER TABLE "company_subscriptions" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "stripe_item_id" TEXT;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "stripe_price_id" TEXT;
