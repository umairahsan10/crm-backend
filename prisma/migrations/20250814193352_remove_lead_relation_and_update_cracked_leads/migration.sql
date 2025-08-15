/*
  Warnings:

  - You are about to drop the column `category` on the `cracked_leads` table. All the data in the column will be lost.
  - Added the required column `industry_id` to the `cracked_leads` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "archive_leads" DROP CONSTRAINT "archive_leads_lead_id_fkey";

-- AlterTable
ALTER TABLE "cracked_leads" DROP COLUMN "category",
ADD COLUMN     "industry_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "cracked_leads" ADD CONSTRAINT "cracked_leads_industry_id_fkey" FOREIGN KEY ("industry_id") REFERENCES "industries"("industry_id") ON DELETE RESTRICT ON UPDATE CASCADE;
