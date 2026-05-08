/*
  Warnings:

  - You are about to drop the column `location_code` on the `tb_product_location` table. All the data in the column will be lost.
  - You are about to drop the column `location_name` on the `tb_product_location` table. All the data in the column will be lost.
  - You are about to drop the column `product_code` on the `tb_product_location` table. All the data in the column will be lost.
  - You are about to drop the column `product_local_name` on the `tb_product_location` table. All the data in the column will be lost.
  - You are about to drop the column `product_name` on the `tb_product_location` table. All the data in the column will be lost.
  - You are about to drop the column `product_sku` on the `tb_product_location` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tb_product_location" DROP COLUMN "location_code",
DROP COLUMN "location_name",
DROP COLUMN "product_code",
DROP COLUMN "product_local_name",
DROP COLUMN "product_name",
DROP COLUMN "product_sku";
