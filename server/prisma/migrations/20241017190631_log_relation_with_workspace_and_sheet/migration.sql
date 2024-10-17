-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "sheetId" TEXT,
ADD COLUMN     "workspace_id" TEXT;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
