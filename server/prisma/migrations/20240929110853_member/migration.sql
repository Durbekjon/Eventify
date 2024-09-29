/*
  Warnings:

  - You are about to drop the column `companyId` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `notificationId` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the `members_on_workspaces` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[notification_id]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `members` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_companyId_fkey";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "members_on_workspaces" DROP CONSTRAINT "members_on_workspaces_member_id_fkey";

-- DropForeignKey
ALTER TABLE "members_on_workspaces" DROP CONSTRAINT "members_on_workspaces_workspace_id_fkey";

-- DropForeignKey
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_companyId_fkey";

-- DropIndex
DROP INDEX "members_notificationId_key";

-- AlterTable
ALTER TABLE "members" DROP COLUMN "companyId",
DROP COLUMN "notificationId",
ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "notification_id" TEXT;

-- AlterTable
ALTER TABLE "workspaces" DROP COLUMN "companyId",
ADD COLUMN     "company_id" TEXT;

-- DropTable
DROP TABLE "members_on_workspaces";

-- CreateTable
CREATE TABLE "_MemberWorkspaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_MemberWorkspaces_AB_unique" ON "_MemberWorkspaces"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberWorkspaces_B_index" ON "_MemberWorkspaces"("B");

-- CreateIndex
CREATE UNIQUE INDEX "members_notification_id_key" ON "members"("notification_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberWorkspaces" ADD CONSTRAINT "_MemberWorkspaces_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberWorkspaces" ADD CONSTRAINT "_MemberWorkspaces_B_fkey" FOREIGN KEY ("B") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
