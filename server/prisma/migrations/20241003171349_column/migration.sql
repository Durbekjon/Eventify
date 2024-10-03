/*
  Warnings:

  - You are about to drop the column `selected_select` on the `columns` table. All the data in the column will be lost.
  - You are about to drop the column `select_id` on the `selects` table. All the data in the column will be lost.
  - Made the column `name` on table `columns` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "selects" DROP CONSTRAINT "selects_select_id_fkey";

-- AlterTable
ALTER TABLE "columns" DROP COLUMN "selected_select",
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "selects" DROP COLUMN "select_id";
