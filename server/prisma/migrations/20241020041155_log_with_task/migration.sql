-- AlterTable
ALTER TABLE "logs" ADD COLUMN     "taskId" TEXT;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
