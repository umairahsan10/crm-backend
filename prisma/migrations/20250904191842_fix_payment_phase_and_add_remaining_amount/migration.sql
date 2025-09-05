-- DropForeignKey
ALTER TABLE "client_payment" DROP CONSTRAINT "client_payment_payment_phase_fkey";

-- AlterTable
ALTER TABLE "cracked_leads" ADD COLUMN     "remaining_amount" INTEGER DEFAULT 0;
