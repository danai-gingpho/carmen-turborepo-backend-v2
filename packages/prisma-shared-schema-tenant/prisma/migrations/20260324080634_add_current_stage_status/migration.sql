-- AlterTable
ALTER TABLE "tb_purchase_order_detail" ADD COLUMN     "current_stage_status" VARCHAR,
ADD COLUMN     "stages_status" JSONB DEFAULT '{}';
