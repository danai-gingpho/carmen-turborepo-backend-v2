-- CreateEnum
CREATE TYPE "enum_issue_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "enum_issue_priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "tb_issue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "status" "enum_issue_status" NOT NULL DEFAULT 'open',
    "priority" "enum_issue_priority" NOT NULL DEFAULT 'medium',
    "assigned_to_id" UUID,
    "due_date" TIMESTAMPTZ(6),
    "category" VARCHAR,
    "tags" VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
    "resolution" VARCHAR,
    "note" VARCHAR,
    "info" JSONB DEFAULT '{}',
    "dimension" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "issue_name_idx" ON "tb_issue"("name");

-- CreateIndex
CREATE INDEX "issue_status_idx" ON "tb_issue"("status");

-- CreateIndex
CREATE INDEX "issue_priority_idx" ON "tb_issue"("priority");

-- CreateIndex
CREATE INDEX "issue_assigned_to_idx" ON "tb_issue"("assigned_to_id");

-- CreateIndex
CREATE INDEX "issue_category_idx" ON "tb_issue"("category");
