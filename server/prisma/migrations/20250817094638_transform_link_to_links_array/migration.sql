/*
  Warnings:

  - You are about to drop the column `link` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `link1` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `link2` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `link3` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `link4` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `link5` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "link",
DROP COLUMN "link1",
DROP COLUMN "link2",
DROP COLUMN "link3",
DROP COLUMN "link4",
DROP COLUMN "link5",
ADD COLUMN     "links" TEXT[];
