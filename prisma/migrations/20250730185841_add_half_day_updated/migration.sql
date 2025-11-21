/*
  Warnings:

  - The primary key for the `half_day_logs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `late_log_id` on the `half_day_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "half_day_logs" DROP CONSTRAINT "half_day_logs_pkey",
DROP COLUMN "late_log_id",
ADD COLUMN     "half_day_log_id" SERIAL NOT NULL,
ALTER COLUMN "confirmation_reason" DROP NOT NULL,
ADD CONSTRAINT "half_day_logs_pkey" PRIMARY KEY ("half_day_log_id");
