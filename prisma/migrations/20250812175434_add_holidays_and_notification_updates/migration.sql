-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('individual', 'bulk_department', 'bulk_all');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "notificationType" "NotificationType" NOT NULL DEFAULT 'individual',
ADD COLUMN     "target_department_id" INTEGER;

-- CreateTable
CREATE TABLE "holidays" (
    "holiday_id" SERIAL NOT NULL,
    "holiday_name" VARCHAR(100) NOT NULL,
    "holiday_date" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("holiday_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "holidays_holiday_date_key" ON "holidays"("holiday_date");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_department_id_fkey" FOREIGN KEY ("target_department_id") REFERENCES "departments"("dept_id") ON DELETE SET NULL ON UPDATE CASCADE;
