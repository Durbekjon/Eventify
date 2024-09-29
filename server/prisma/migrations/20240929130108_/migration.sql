/*
  Warnings:

  - Added the required column `company_id` to the `sheets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sheets" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
