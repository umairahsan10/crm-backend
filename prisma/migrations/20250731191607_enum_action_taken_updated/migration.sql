/*
  Warnings:

  - The values [Approved,Rejected] on the enum `LateAction` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LateAction_new" AS ENUM ('Created', 'Pending', 'Completed');
ALTER TABLE "half_day_logs" ALTER COLUMN "action_taken" DROP DEFAULT;
ALTER TABLE "late_logs" ALTER COLUMN "action_taken" DROP DEFAULT;
ALTER TABLE "half_day_logs" ALTER COLUMN "action_taken" TYPE "LateAction_new" USING ("action_taken"::text::"LateAction_new");
ALTER TABLE "late_logs" ALTER COLUMN "action_taken" TYPE "LateAction_new" USING ("action_taken"::text::"LateAction_new");
ALTER TYPE "LateAction" RENAME TO "LateAction_old";
ALTER TYPE "LateAction_new" RENAME TO "LateAction";
DROP TYPE "LateAction_old";
ALTER TABLE "half_day_logs" ALTER COLUMN "action_taken" SET DEFAULT 'Pending';
ALTER TABLE "late_logs" ALTER COLUMN "action_taken" SET DEFAULT 'Created';
COMMIT;

-- AlterTable
ALTER TABLE "late_logs" ALTER COLUMN "action_taken" SET DEFAULT 'Created'; 