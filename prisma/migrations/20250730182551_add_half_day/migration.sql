-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "absent_time" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "half_deduction" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quarterly_leaves_days" SET DEFAULT 0,
ALTER COLUMN "monthly_lates_days" SET DEFAULT 0,
ALTER COLUMN "absent_deduction" SET DEFAULT 0,
ALTER COLUMN "late_deduction" SET DEFAULT 0,
ALTER COLUMN "late_time" SET DEFAULT 0,
ALTER COLUMN "half_time" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "half_day_logs" (
    "late_log_id" SERIAL NOT NULL,
    "emp_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "scheduled_time_in" VARCHAR(10) NOT NULL,
    "actual_time_in" VARCHAR(10) NOT NULL,
    "minutes_late" INTEGER NOT NULL,
    "reason" TEXT,
    "justified" BOOLEAN DEFAULT false,
    "action_taken" "LateAction" NOT NULL DEFAULT 'Pending',
    "confirmation_reason" "ConfirmationAction" NOT NULL,
    "reviewed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "half_day_logs_pkey" PRIMARY KEY ("late_log_id")
);

-- AddForeignKey
ALTER TABLE "half_day_logs" ADD CONSTRAINT "half_day_logs_emp_id_fkey" FOREIGN KEY ("emp_id") REFERENCES "employees"("emp_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "half_day_logs" ADD CONSTRAINT "half_day_logs_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;
