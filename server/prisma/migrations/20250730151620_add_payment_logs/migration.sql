-- CreateTable
CREATE TABLE "payment_logs" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT,
    "transaction_id" TEXT,
    "subscription_id" TEXT,
    "plan_id" TEXT,
    "amount" INTEGER,
    "currency" TEXT,
    "status" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "company_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
