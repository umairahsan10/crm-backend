-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_manager_id_fkey";

-- AlterTable
ALTER TABLE "departments" ALTER COLUMN "manager_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
