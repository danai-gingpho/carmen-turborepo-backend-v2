-- AlterTable
ALTER TABLE "tb_count_stock_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_credit_note_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_extra_cost_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_good_received_note_detail_item" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_jv_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_physical_count_detail" ADD COLUMN     "comment" VARCHAR,
ADD COLUMN     "sequence_no" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "tb_pricelist_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_pricelist_template_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_purchase_order_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_request_for_pricing_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_spot_check_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_stock_in_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_stock_out_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_store_requisition_detail" ADD COLUMN     "comment" VARCHAR;

-- AlterTable
ALTER TABLE "tb_transfer_detail" ADD COLUMN     "comment" VARCHAR;
