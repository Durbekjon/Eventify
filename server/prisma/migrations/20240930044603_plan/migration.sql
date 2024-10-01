-- CreateEnum
CREATE TYPE "RoleTypes" AS ENUM ('AUTHOR', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MemberTypes" AS ENUM ('MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "MemberPermissions" AS ENUM ('ALL', 'READ', 'CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('ALL', 'OWN');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('NEW', 'ACTIVE', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationFrom" AS ENUM ('APPLICATION_TEAM', 'COMPANY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NOTIFICATION', 'INVITATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "selectedRole" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restore_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restore_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT NOT NULL,
    "plan_id" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "type" "RoleTypes" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "member_id" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "type" "MemberTypes" NOT NULL,
    "permissions" "MemberPermissions"[],
    "view" "ViewType" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'NEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_id" TEXT,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" "NotificationType" NOT NULL,
    "text" TEXT NOT NULL,
    "from" "NotificationFrom" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_id" TEXT,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sheets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "max_workspaces" INTEGER NOT NULL,
    "max_sheets" INTEGER NOT NULL,
    "max_members" INTEGER NOT NULL,
    "max_viewers" INTEGER NOT NULL,
    "order" SERIAL NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selects" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT 'untitled',
    "color" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "selects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MemberWorkspaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_codes_email_key" ON "verification_codes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "restore_codes_email_key" ON "restore_codes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_member_id_key" ON "roles"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_notification_id_key" ON "members"("notification_id");

-- CreateIndex
CREATE UNIQUE INDEX "_MemberWorkspaces_AB_unique" ON "_MemberWorkspaces"("A", "B");

-- CreateIndex
CREATE INDEX "_MemberWorkspaces_B_index" ON "_MemberWorkspaces"("B");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheets" ADD CONSTRAINT "sheets_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selects" ADD CONSTRAINT "selects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberWorkspaces" ADD CONSTRAINT "_MemberWorkspaces_A_fkey" FOREIGN KEY ("A") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberWorkspaces" ADD CONSTRAINT "_MemberWorkspaces_B_fkey" FOREIGN KEY ("B") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
