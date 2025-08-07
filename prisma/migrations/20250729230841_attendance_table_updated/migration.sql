-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "half_days" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "monthly_attendance_summary" ADD COLUMN     "total_half_days" INTEGER NOT NULL DEFAULT 0;
