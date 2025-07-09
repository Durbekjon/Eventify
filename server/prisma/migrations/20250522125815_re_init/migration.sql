-- AlterTable
ALTER TABLE "_member_workspaces" ADD CONSTRAINT "_member_workspaces_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_member_workspaces_AB_unique";
