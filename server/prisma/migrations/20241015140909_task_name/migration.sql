/*
  Warnings:

  - Added the required column `name` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "name" TEXT NOT NULL;
