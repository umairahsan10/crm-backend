-- AlterTable
ALTER TABLE "client_payment" ADD COLUMN "cracked_lead_id" INTEGER;

-- AddForeignKey
ALTER TABLE "client_payment" ADD CONSTRAINT "client_payment_cracked_lead_id_fkey" FOREIGN KEY ("cracked_lead_id") REFERENCES "cracked_leads"("cracked_lead_id") ON DELETE SET NULL ON UPDATE CASCADE;
