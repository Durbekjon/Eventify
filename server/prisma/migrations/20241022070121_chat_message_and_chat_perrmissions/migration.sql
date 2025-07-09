/*
  Warnings:

  - You are about to drop the `_MemberWorkspaces` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MemberWorkspaces" DROP CONSTRAINT "_MemberWorkspaces_A_fkey";

-- DropForeignKey
ALTER TABLE "_MemberWorkspaces" DROP CONSTRAINT "_MemberWorkspaces_B_fkey";

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "chatId" TEXT;

-- DropTable
DROP TABLE "_MemberWorkspaces";

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "contenct" TEXT NOT NULL,
    "isUpdated" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_permissions" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "send_message" BOOLEAN NOT NULL DEFAULT true,
    "pin_message" BOOLEAN NOT NULL DEFAULT false,
    "delete_message" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chat_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_member_workspaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_permissions_chatId_key" ON "chat_permissions"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "_member_workspaces_AB_unique" ON "_member_workspaces"("A", "B");

-- CreateIndex
CREATE INDEX "_member_workspaces_B_index" ON "_member_workspaces"("B");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_permissions" ADD CONSTRAINT "chat_permissions_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_member_workspaces" ADD CONSTRAINT "_member_workspaces_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_member_workspaces" ADD CONSTRAINT "_member_workspaces_B_fkey" FOREIGN KEY ("B") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
