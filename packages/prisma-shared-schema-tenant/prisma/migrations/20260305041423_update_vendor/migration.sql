/*
  Warnings:

  - You are about to drop the column `data` on the `tb_vendor_address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tb_vendor_address" DROP COLUMN "data",
ADD COLUMN     "address_line1" VARCHAR,
ADD COLUMN     "address_line2" VARCHAR,
ADD COLUMN     "city" VARCHAR,
ADD COLUMN     "country" VARCHAR,
ADD COLUMN     "district" VARCHAR,
ADD COLUMN     "postal_code" VARCHAR,
ADD COLUMN     "province" VARCHAR;
