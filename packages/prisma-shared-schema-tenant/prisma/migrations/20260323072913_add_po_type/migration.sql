-- CreateEnum
CREATE TYPE "enum_purchase_order_type" AS ENUM ('manual', 'purchase_request');

-- AlterTable
ALTER TABLE "tb_purchase_order" ADD COLUMN     "po_type" "enum_purchase_order_type" NOT NULL DEFAULT 'purchase_request';
