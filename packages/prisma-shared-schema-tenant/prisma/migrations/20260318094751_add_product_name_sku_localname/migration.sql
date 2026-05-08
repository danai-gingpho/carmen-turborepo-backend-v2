-- AlterTable
ALTER TABLE "tb_count_stock_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_credit_note_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_good_received_note_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_period_snapshot" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_physical_count_detail" ADD COLUMN     "product_local_name" VARCHAR,
ALTER COLUMN "product_name" DROP NOT NULL,
ALTER COLUMN "product_code" DROP NOT NULL,
ALTER COLUMN "product_sku" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tb_pricelist_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_pricelist_template_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_product_location" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_product_tb_vendor" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_purchase_order_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_purchase_request_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_purchase_request_template_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_spot_check_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_local_name" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_stock_in_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_stock_out_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_store_requisition_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;

-- AlterTable
ALTER TABLE "tb_transfer_detail" ADD COLUMN     "product_code" VARCHAR,
ADD COLUMN     "product_sku" VARCHAR;
