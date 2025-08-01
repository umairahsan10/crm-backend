-- DropForeignKey
ALTER TABLE "archive_leads" DROP CONSTRAINT "archive_leads_unit_id_fkey";

-- AlterTable
ALTER TABLE "archive_leads" ALTER COLUMN "unit_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "archive_leads" ADD CONSTRAINT "archive_leads_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "sales_units"("sales_unit_id") ON DELETE SET NULL ON UPDATE CASCADE;
