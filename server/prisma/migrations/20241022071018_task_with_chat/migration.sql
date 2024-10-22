/*
  Warnings:

  - A unique constraint covering the columns `[task_id]` on the table `chats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "task_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "chats_task_id_key" ON "chats"("task_id");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
