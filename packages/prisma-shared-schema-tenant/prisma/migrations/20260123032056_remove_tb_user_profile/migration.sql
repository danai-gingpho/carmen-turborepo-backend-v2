/*
  Warnings:

  - You are about to drop the `tb_user_profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "tb_user_profile";

-- CreateTable
CREATE TABLE "tb_transfer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tr_no" VARCHAR,
    "tr_date" TIMESTAMPTZ(6),
    "description" VARCHAR,
    "doc_status" "enum_doc_status" NOT NULL DEFAULT 'draft',
    "from_location_id" UUID,
    "from_location_code" VARCHAR,
    "from_location_name" VARCHAR,
    "to_location_id" UUID,
    "to_location_code" VARCHAR,
    "to_location_name" VARCHAR,
    "workflow_id" UUID,
    "workflow_name" VARCHAR,
    "workflow_history" JSONB DEFAULT '{}',
    "workflow_current_stage" VARCHAR,
    "workflow_previous_stage" VARCHAR,
    "workflow_next_stage" VARCHAR,
    "user_action" JSONB DEFAULT '{}',
    "last_action" "enum_last_action" DEFAULT 'submitted',
    "last_action_at_date" TIMESTAMPTZ(6),
    "last_action_by_id" UUID,
    "last_action_by_name" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '[]',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_transfer_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transfer_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_transfer_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_transfer_detail" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_transaction_id" UUID,
    "transfer_id" UUID NOT NULL,
    "sequence_no" INTEGER DEFAULT 1,
    "description" VARCHAR,
    "product_id" UUID NOT NULL,
    "product_name" VARCHAR,
    "product_local_name" VARCHAR,
    "qty" DECIMAL(20,5) DEFAULT 0,
    "cost_per_unit" DECIMAL(20,5) DEFAULT 0,
    "total_cost" DECIMAL(20,5) DEFAULT 0,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '[]',
    "doc_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_transfer_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_transfer_detail_comment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "transfer_detail_id" UUID NOT NULL,
    "type" "enum_comment_type" NOT NULL DEFAULT 'user',
    "user_id" UUID,
    "message" TEXT,
    "attachments" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_transfer_detail_comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TR0_tr_no_idx" ON "tb_transfer"("tr_no");

-- CreateIndex
CREATE UNIQUE INDEX "TR1_tr_no_u" ON "tb_transfer"("tr_no", "deleted_at");

-- CreateIndex
CREATE INDEX "TRT2_transfer_product_idx" ON "tb_transfer_detail"("transfer_id", "product_id");

-- CreateIndex
CREATE INDEX "TRT2_transfer_idx" ON "tb_transfer_detail"("transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX "TRT1_transfer_product_dimension_u" ON "tb_transfer_detail"("transfer_id", "product_id", "dimension", "deleted_at");

-- AddForeignKey
ALTER TABLE "tb_transfer" ADD CONSTRAINT "tb_transfer_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_transfer" ADD CONSTRAINT "tb_transfer_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "tb_location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_transfer_comment" ADD CONSTRAINT "tb_transfer_comment_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "tb_transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_transfer_detail" ADD CONSTRAINT "tb_transfer_detail_inventory_transaction_id_fkey" FOREIGN KEY ("inventory_transaction_id") REFERENCES "tb_inventory_transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_transfer_detail" ADD CONSTRAINT "tb_transfer_detail_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "tb_product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_transfer_detail" ADD CONSTRAINT "tb_transfer_detail_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "tb_transfer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tb_transfer_detail_comment" ADD CONSTRAINT "tb_transfer_detail_comment_transfer_detail_id_fkey" FOREIGN KEY ("transfer_detail_id") REFERENCES "tb_transfer_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
