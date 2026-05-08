/*
  Warnings:

  - You are about to drop the column `period_id` on the `tb_physical_count` table. All the data in the column will be lost.
  - You are about to drop the column `counting_period_from_date` on the `tb_physical_count_period` table. All the data in the column will be lost.
  - You are about to drop the column `counting_period_to_date` on the `tb_physical_count_period` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[physical_count_period_id,location_id,deleted_at]` on the table `tb_physical_count` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[period_id,deleted_at]` on the table `tb_physical_count_period` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `physical_count_period_id` to the `tb_physical_count` table without a default value. This is not possible if the table is not empty.
  - Added the required column `period_id` to the `tb_physical_count_period` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tb_physical_count" DROP CONSTRAINT "tb_physical_count_period_id_fkey";

-- DropIndex
DROP INDEX "physical_count_delete_at_u";

-- DropIndex
DROP INDEX "tb_physical_count_period_id_location_id_idx";

-- DropIndex
DROP INDEX "physical_count_period_delete_at_u";

-- DropIndex
DROP INDEX "tb_physical_count_period_counting_period_from_date_counting_idx";

-- AlterTable
ALTER TABLE "tb_physical_count" DROP COLUMN "period_id",
ADD COLUMN     "physical_count_period_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "tb_physical_count_period" DROP COLUMN "counting_period_from_date",
DROP COLUMN "counting_period_to_date",
ADD COLUMN     "period_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "tb_physical_count_physical_count_period_id_location_id_idx" ON "tb_physical_count"("physical_count_period_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "physical_count_delete_at_u" ON "tb_physical_count"("physical_count_period_id", "location_id", "deleted_at");

-- CreateIndex
CREATE INDEX "tb_physical_count_period_period_id_idx" ON "tb_physical_count_period"("period_id");

-- CreateIndex
CREATE UNIQUE INDEX "physical_count_period_delete_at_u" ON "tb_physical_count_period"("period_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "tb_physical_count_period" ADD CONSTRAINT "tb_physical_count_period_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "tb_period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_physical_count" ADD CONSTRAINT "tb_physical_count_physical_count_period_id_fkey" FOREIGN KEY ("physical_count_period_id") REFERENCES "tb_physical_count_period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
