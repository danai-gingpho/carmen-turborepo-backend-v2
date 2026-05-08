-- AlterTable
ALTER TABLE "tb_purchase_order_detail_tb_purchase_request_detail" ADD COLUMN     "delivery_point_id" UUID,
ADD COLUMN     "delivery_point_name" VARCHAR,
ADD COLUMN     "location_code" VARCHAR,
ADD COLUMN     "location_id" UUID,
ADD COLUMN     "location_name" VARCHAR,
ALTER COLUMN "pr_detail_id" DROP NOT NULL,
ALTER COLUMN "pr_detail_order_unit_id" DROP NOT NULL,
ALTER COLUMN "pr_detail_order_unit_name" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail_tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_order_detail_tb_purchase_request_detail_delive_fkey" FOREIGN KEY ("delivery_point_id") REFERENCES "tb_delivery_point"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_order_detail_tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_order_detail_tb_purchase_request_detail_locati_fkey" FOREIGN KEY ("location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_purchase_request_detail" ADD CONSTRAINT "tb_purchase_request_detail_delivery_point_id_fkey" FOREIGN KEY ("delivery_point_id") REFERENCES "tb_delivery_point"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
