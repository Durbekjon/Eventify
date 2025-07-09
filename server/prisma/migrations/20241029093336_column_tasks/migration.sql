-- AlterTable
ALTER TABLE "columns" ADD COLUMN     "selected_select" TEXT;

-- AlterTable
ALTER TABLE "selects" ADD COLUMN     "column_id" TEXT;

-- AddForeignKey
ALTER TABLE "selects" ADD CONSTRAINT "selects_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "columns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
