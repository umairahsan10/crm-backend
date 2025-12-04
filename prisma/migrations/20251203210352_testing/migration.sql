-- AlterTable
ALTER TABLE "attendance_logs" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "companies" ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'active';