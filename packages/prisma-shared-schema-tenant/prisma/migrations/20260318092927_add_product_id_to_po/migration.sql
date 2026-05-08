/*
  Warnings:

  - Added the required column `product_id` to the `tb_purchase_order_detail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tb_purchase_order_detail" ADD COLUMN     "product_id" UUID NOT NULL,
ADD COLUMN     "product_name" VARCHAR;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail" ADD CONSTRAINT "tb_purchase_order_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
