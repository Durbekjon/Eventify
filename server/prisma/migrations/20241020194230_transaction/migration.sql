/*
  Warnings:

  - The values [REFUNDED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `sheetId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_number` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_payment_intent_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_transaction_id` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');
ALTER TABLE "transactions" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "TransactionStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "logs" DROP CONSTRAINT "logs_sheetId_fkey";

-- DropForeignKey
ALTER TABLE "logs" DROP CONSTRAINT "logs_taskId_fkey";

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "sheetId",
DROP COLUMN "taskId",
ADD COLUMN     "sheet_id" TEXT,
ADD COLUMN     "task_id" TEXT;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "payment_method_id",
DROP COLUMN "reference_number",
DROP COLUMN "stripe_payment_intent_id",
DROP COLUMN "stripe_transaction_id",
ADD COLUMN     "session_url" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
