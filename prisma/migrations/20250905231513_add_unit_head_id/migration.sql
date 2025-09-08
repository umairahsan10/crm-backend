-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "unit_head_id" INTEGER;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_unit_head_id_fkey" FOREIGN KEY ("unit_head_id") REFERENCES "employees"("emp_id") ON DELETE SET NULL ON UPDATE CASCADE;
