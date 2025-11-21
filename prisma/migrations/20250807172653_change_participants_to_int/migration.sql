/*
  Warnings:

  - The `participants` column on the `project_chats` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "project_chats" DROP COLUMN "participants",
ADD COLUMN     "participants" INTEGER;
