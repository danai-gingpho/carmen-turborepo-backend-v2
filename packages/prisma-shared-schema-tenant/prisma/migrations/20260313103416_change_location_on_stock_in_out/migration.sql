/*
  Warnings:

  - You are about to drop the column `location_code` on the `tb_stock_in_detail` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `tb_stock_in_detail` table. All the data in the column will be lost.
  - You are about to drop the column `location_name` on the `tb_stock_in_detail` table. All the data in the column will be lost.
  - You are about to drop the column `location_code` on the `tb_stock_out_detail` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `tb_stock_out_detail` table. All the data in the column will be lost.
  - You are about to drop the column `location_name` on the `tb_stock_out_detail` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stock_in_id,product_id,dimension,deleted_at]` on the table `tb_stock_in_detail` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stock_out_id,product_id,dimension,deleted_at]` on the table `tb_stock_out_detail` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "tb_stock_in_detail" DROP CONSTRAINT "tb_stock_in_detail_location_id_fkey";

-- DropForeignKey
ALTER TABLE "tb_stock_out_detail" DROP CONSTRAINT "tb_stock_out_detail_location_id_fkey";

-- DropIndex
DROP INDEX "SIT1_stock_in_product_location_dimension_u";

-- DropIndex
DROP INDEX "SIT2_stock_in_product_location_idx";

-- DropIndex
DROP INDEX "SOT1_stock_out_product_location_dimension_u";

-- DropIndex
DROP INDEX "SOT2_stock_out_product_location_idx";

-- AlterTable
ALTER TABLE "tb_stock_in" ADD COLUMN     "location_code" VARCHAR,
ADD COLUMN     "location_id" UUID,
ADD COLUMN     "location_name" VARCHAR;

-- AlterTable
ALTER TABLE "tb_stock_in_detail" DROP COLUMN "location_code",
DROP COLUMN "location_id",
DROP COLUMN "location_name";

-- AlterTable
ALTER TABLE "tb_stock_out" ADD COLUMN     "location_code" VARCHAR,
ADD COLUMN     "location_id" UUID,
ADD COLUMN     "location_name" VARCHAR;

-- AlterTable
ALTER TABLE "tb_stock_out_detail" DROP COLUMN "location_code",
DROP COLUMN "location_id",
DROP COLUMN "location_name";

-- CreateIndex
CREATE INDEX "SIT2_stock_in_product_idx" ON "tb_stock_in_detail"("stock_in_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "SIT1_stock_in_product_dimension_u" ON "tb_stock_in_detail"("stock_in_id", "product_id", "dimension", "deleted_at");

-- CreateIndex
CREATE INDEX "SOT2_stock_out_product_idx" ON "tb_stock_out_detail"("stock_out_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "SOT1_stock_out_product_dimension_u" ON "tb_stock_out_detail"("stock_out_id", "product_id", "dimension", "deleted_at");

-- AddForeignKey
ALTER TABLE "tb_stock_in" ADD CONSTRAINT "tb_stock_in_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out" ADD CONSTRAINT "tb_stock_out_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
