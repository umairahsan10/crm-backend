/*
  Warnings:

  - You are about to drop the column `bonus` on the `sales_departments` table. All the data in the column will be lost.
  - Added the required column `transaction_id` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_id` to the `liabilities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "transaction_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "liabilities" ADD COLUMN     "transaction_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sales_departments" DROP COLUMN "bonus",
ADD COLUMN     "sales_bonus" DECIMAL(12,2);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;
