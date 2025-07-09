-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "new_value" TEXT,
ADD COLUMN     "old_value" TEXT,
ADD COLUMN     "updated_key" TEXT;
