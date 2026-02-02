/*
  Warnings:

  - The `entity_type` column on the `tb_activity` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "tb_activity" DROP COLUMN "entity_type",
ADD COLUMN     "entity_type" TEXT;

-- DropEnum
DROP TYPE "enum_activity_entity_type";

-- CreateIndex
CREATE INDEX "activity_entitytype_entityid_idx" ON "tb_activity"("entity_type", "entity_id");
