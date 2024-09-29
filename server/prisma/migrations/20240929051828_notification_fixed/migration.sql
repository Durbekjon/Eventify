/*
  Warnings:

  - You are about to drop the column `selected_role` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `member_id` on the `notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[notificationId]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_member_id_fkey";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "selected_role",
ADD COLUMN     "notificationId" TEXT;

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "member_id";

-- CreateIndex
CREATE UNIQUE INDEX "members_notificationId_key" ON "members"("notificationId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
