-- DropForeignKey
ALTER TABLE "columns" DROP CONSTRAINT "columns_sheet_id_fkey";

-- AddForeignKey
ALTER TABLE "columns" ADD CONSTRAINT "columns_sheet_id_fkey" FOREIGN KEY ("sheet_id") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
