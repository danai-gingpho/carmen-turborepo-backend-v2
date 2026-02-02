-- CreateEnum
CREATE TYPE "enum_adjustment_type" AS ENUM ('STOCK_IN', 'STOCK_OUT');

-- AlterTable
ALTER TABLE "tb_stock_in" ADD COLUMN     "adjustment_type_code" VARCHAR,
ADD COLUMN     "adjustment_type_id" UUID;

-- AlterTable
ALTER TABLE "tb_stock_out" ADD COLUMN     "adjustment_type_code" VARCHAR,
ADD COLUMN     "adjustment_type_id" UUID;

-- CreateTable
CREATE TABLE "tb_adjustment_type" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "type" "enum_adjustment_type" NOT NULL,
    "description" VARCHAR,
    "is_active" BOOLEAN DEFAULT true,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_adjustment_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AT1_code_idx" ON "tb_adjustment_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AT1_code_u" ON "tb_adjustment_type"("code", "deleted_at");

-- AddForeignKey
ALTER TABLE "tb_stock_in" ADD CONSTRAINT "tb_stock_in_adjustment_type_id_fkey" FOREIGN KEY ("adjustment_type_id") REFERENCES "tb_adjustment_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_stock_out" ADD CONSTRAINT "tb_stock_out_adjustment_type_id_fkey" FOREIGN KEY ("adjustment_type_id") REFERENCES "tb_adjustment_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
