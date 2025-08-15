-- AlterTable
ALTER TABLE "public"."plans" ADD COLUMN     "isCustomized" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."_customized_for_users" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_customized_for_users_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_customized_for_users_B_index" ON "public"."_customized_for_users"("B");

-- AddForeignKey
ALTER TABLE "public"."_customized_for_users" ADD CONSTRAINT "_customized_for_users_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_customized_for_users" ADD CONSTRAINT "_customized_for_users_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
