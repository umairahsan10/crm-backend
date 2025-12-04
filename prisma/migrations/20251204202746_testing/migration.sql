-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "attachment_name" TEXT,
ADD COLUMN     "attachment_size" INTEGER,
ADD COLUMN     "attachment_type" TEXT,
ADD COLUMN     "attachment_url" TEXT;
