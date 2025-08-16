-- AlterEnum
ALTER TYPE "public"."ColumnType" ADD VALUE 'FILES';

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "duedate1" TIMESTAMP(3)[],
ADD COLUMN     "duedate2" TIMESTAMP(3)[],
ADD COLUMN     "duedate3" TIMESTAMP(3)[],
ADD COLUMN     "duedate4" TIMESTAMP(3)[],
ADD COLUMN     "duedate5" TIMESTAMP(3)[];
