/*
  Warnings:

  - The values [LINK] on the enum `ColumnType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ColumnType_new" AS ENUM ('SELECT', 'TEXT', 'NUMBER', 'LINKS', 'MEMBERS', 'DATE', 'DUEDATE', 'FILE', 'CHECK', 'FILES');
ALTER TABLE "public"."columns" ALTER COLUMN "type" TYPE "public"."ColumnType_new" USING ("type"::text::"public"."ColumnType_new");
ALTER TYPE "public"."ColumnType" RENAME TO "ColumnType_old";
ALTER TYPE "public"."ColumnType_new" RENAME TO "ColumnType";
DROP TYPE "public"."ColumnType_old";
COMMIT;
