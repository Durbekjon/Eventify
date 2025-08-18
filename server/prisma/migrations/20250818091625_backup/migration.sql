-- CreateEnum
CREATE TYPE "public"."BackupStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."backups" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."BackupStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "backup_key" TEXT,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);
