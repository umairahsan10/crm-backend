/*
  Warnings:

  - You are about to drop the column `is_half_day` on the `leave_logs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProcessedByRole" AS ENUM ('Employee', 'Admin');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "processed_by_role" "ProcessedByRole";

-- AlterTable
ALTER TABLE "leave_logs" DROP COLUMN "is_half_day";

-- AlterTable
ALTER TABLE "net_salary_logs" ADD COLUMN     "processed_by_role" "ProcessedByRole";

-- AlterTable
ALTER TABLE "sales_departments" ADD COLUMN     "chargeback_deductions" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "refund_deductions" DECIMAL(12,2) DEFAULT 0;
