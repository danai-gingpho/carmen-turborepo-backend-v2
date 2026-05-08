-- CreateEnum
CREATE TYPE "enum_physical_count_costing_method" AS ENUM ('standard', 'last', 'average', 'last_receiving');

-- AlterEnum
ALTER TYPE "enum_business_unit_config_key" ADD VALUE 'physical_count_costing_method';

-- AlterTable
ALTER TABLE "tb_product" ADD COLUMN     "standard_cost" DECIMAL(20,5) DEFAULT 0;

-- AlterTable
ALTER TABLE "tb_stock_out_detail" ADD COLUMN     "cost_per_unit" DECIMAL(20,5) DEFAULT 0,
ADD COLUMN     "total_cost" DECIMAL(20,5) DEFAULT 0;
