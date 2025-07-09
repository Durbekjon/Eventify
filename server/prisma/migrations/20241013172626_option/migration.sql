/*
  Warnings:

  - You are about to drop the column `value` on the `selects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "selects" DROP COLUMN "value",
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'untitled';

-- CreateTable
CREATE TABLE "options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "select_id" TEXT NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_select_id_fkey" FOREIGN KEY ("select_id") REFERENCES "selects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
