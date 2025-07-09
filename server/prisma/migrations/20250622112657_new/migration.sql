/*
  Warnings:

  - The `number1` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `number2` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `number3` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `number4` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `number5` column on the `tasks` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "number1",
ADD COLUMN     "number1" INTEGER,
DROP COLUMN "number2",
ADD COLUMN     "number2" INTEGER,
DROP COLUMN "number3",
ADD COLUMN     "number3" INTEGER,
DROP COLUMN "number4",
ADD COLUMN     "number4" INTEGER,
DROP COLUMN "number5",
ADD COLUMN     "number5" INTEGER;
