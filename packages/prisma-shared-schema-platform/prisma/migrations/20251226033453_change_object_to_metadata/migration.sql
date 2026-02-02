/*
  Warnings:

  - You are about to drop the column `object` on the `tb_notification` table. All the data in the column will be lost.
  - You are about to alter the column `category` on the `tb_notification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "tb_notification" DROP COLUMN "object",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "type" SET DEFAULT 'SYS_INFO',
ALTER COLUMN "category" SET DEFAULT 'system',
ALTER COLUMN "category" SET DATA TYPE VARCHAR(255);
