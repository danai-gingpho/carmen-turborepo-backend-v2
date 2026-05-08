-- CreateEnum
CREATE TYPE "enum_report_format" AS ENUM ('pdf', 'excel', 'csv', 'json');

-- CreateEnum
CREATE TYPE "enum_report_category" AS ENUM ('inventory', 'procurement', 'recipe', 'vendor', 'financial', 'operational');

-- CreateEnum
CREATE TYPE "enum_report_job_status" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateTable
CREATE TABLE "tb_report_job" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_type" VARCHAR(100) NOT NULL,
    "report_category" "enum_report_category" NOT NULL,
    "format" "enum_report_format" NOT NULL,
    "status" "enum_report_job_status" NOT NULL DEFAULT 'queued',
    "filters" JSONB DEFAULT '{}',
    "options" JSONB DEFAULT '{}',
    "file_url" TEXT,
    "file_name" VARCHAR(255),
    "file_size" BIGINT,
    "row_count" INTEGER,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "duration_ms" INTEGER,
    "requested_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_report_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_report_schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "report_type" VARCHAR(100) NOT NULL,
    "format" "enum_report_format" NOT NULL,
    "cron_expression" VARCHAR(100) NOT NULL,
    "filters" JSONB DEFAULT '{}',
    "options" JSONB DEFAULT '{}',
    "recipients" JSONB DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMPTZ(6),
    "next_run_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,

    CONSTRAINT "tb_report_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_report_job_status" ON "tb_report_job"("status");

-- CreateIndex
CREATE INDEX "idx_report_job_type" ON "tb_report_job"("report_type");

-- CreateIndex
CREATE INDEX "idx_report_job_requested" ON "tb_report_job"("requested_by_id");

-- CreateIndex
CREATE INDEX "idx_report_job_created" ON "tb_report_job"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_report_schedule_active" ON "tb_report_schedule"("is_active");
