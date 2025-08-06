/*
  Warnings:

  - You are about to drop the column `tax_permission` on the `accountants` table. All the data in the column will be lost.
  - You are about to drop the column `depreciation_rate` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `monthly_leave_request` on the `hr` table. All the data in the column will be lost.
  - You are about to drop the column `salaries_paid` on the `profit_loss` table. All the data in the column will be lost.
  - You are about to drop the column `team_lead_id` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `unit_head_id` on the `projects` table. All the data in the column will be lost.
  - Added the required column `user_type` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('admin', 'employee');

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_team_lead_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_unit_head_id_fkey";

-- AlterTable
ALTER TABLE "accountants" DROP COLUMN "tax_permission",
ADD COLUMN     "liabilities_permission" BOOLEAN;

-- AlterTable
ALTER TABLE "assets" DROP COLUMN "depreciation_rate";

-- AlterTable
ALTER TABLE "hr" DROP COLUMN "monthly_leave_request",
ADD COLUMN     "monthly_request_approvals" BOOLEAN;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "user_type" "UserType" NOT NULL;

-- AlterTable
ALTER TABLE "profit_loss" DROP COLUMN "salaries_paid";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "team_lead_id",
DROP COLUMN "unit_head_id",
ADD COLUMN     "team_id" INTEGER;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("team_id") ON DELETE SET NULL ON UPDATE CASCADE;
