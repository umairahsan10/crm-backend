/*
  Warnings:

  - You are about to drop the column `quarterly_leaves` on the `attendance` table. All the data in the column will be lost.
  - You are about to drop the column `quarterly_leaves_days` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "attendance" DROP COLUMN "quarterly_leaves",
ADD COLUMN     "available_leaves" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "quarterly_leaves_days",
ADD COLUMN     "monthly_leaves_accrual" INTEGER NOT NULL DEFAULT 2;
