-- AlterTable
ALTER TABLE "admin_requests" ADD COLUMN     "hr_id" INTEGER;

-- AddForeignKey
ALTER TABLE "admin_requests" ADD CONSTRAINT "admin_requests_hr_id_fkey" FOREIGN KEY ("hr_id") REFERENCES "hr"("hr_id") ON DELETE SET NULL ON UPDATE CASCADE;
