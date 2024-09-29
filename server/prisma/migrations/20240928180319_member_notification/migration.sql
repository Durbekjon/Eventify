/*
  Warnings:

  - You are about to drop the column `companyId` on the `roles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[member_id]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `member_id` to the `roles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberTypes" AS ENUM ('MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MemberPermissions" AS ENUM ('ALL', 'READ', 'CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('ALL', 'OWN');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('NEW', 'ACTIVE', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationFrom" AS ENUM ('APPLICATION_TEAM', 'COMPANY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NOTIFICATION', 'INVITATION');

-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_companyId_fkey";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "companyId",
ADD COLUMN     "company_id" TEXT NOT NULL,
ADD COLUMN     "member_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "type" "MemberTypes" NOT NULL,
    "permissions" "MemberPermissions"[],
    "view" "ViewType" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL,
    "text" TEXT NOT NULL,
    "from" "NotificationFrom" NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT,
    "member_id" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_member_id_key" ON "roles"("member_id");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
