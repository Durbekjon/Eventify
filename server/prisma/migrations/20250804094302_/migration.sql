/*
  Warnings:

  - You are about to drop the column `max_requests` on the `plans` table. All the data in the column will be lost.
  - Added the required column `max_tasks` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plans" DROP COLUMN "max_requests",
ADD COLUMN     "max_tasks" INTEGER NOT NULL;
