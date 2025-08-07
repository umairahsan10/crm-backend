/*
  Warnings:

  - You are about to drop the column `confirmation_reason` on the `half_day_logs` table. All the data in the column will be lost.
  - You are about to drop the column `confirmation_reason` on the `late_logs` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "HalfDayType" AS ENUM ('paid', 'unpaid');

-- CreateEnum
CREATE TYPE "LateType" AS ENUM ('paid', 'unpaid');

-- AlterTable
ALTER TABLE "half_day_logs" DROP COLUMN "confirmation_reason",
ADD COLUMN     "half_day_type" "HalfDayType" DEFAULT 'unpaid';

-- AlterTable
ALTER TABLE "late_logs" DROP COLUMN "confirmation_reason",
ADD COLUMN     "late_type" "LateType" DEFAULT 'unpaid';

-- DropEnum
DROP TYPE "ConfirmationAction";
