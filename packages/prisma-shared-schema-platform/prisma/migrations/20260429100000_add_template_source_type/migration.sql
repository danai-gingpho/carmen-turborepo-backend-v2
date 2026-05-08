-- Add source_type / source_name / source_params to tb_report_template.
-- Replaces the legacy view_name column for new templates while keeping it
-- around for back-compat (the Go registry falls back to view_name when
-- source_name is empty).

ALTER TABLE "tb_report_template"
  ADD COLUMN IF NOT EXISTS "source_type"   VARCHAR(20) NOT NULL DEFAULT 'view',
  ADD COLUMN IF NOT EXISTS "source_name"   VARCHAR,
  ADD COLUMN IF NOT EXISTS "source_params" JSONB NOT NULL DEFAULT '{"params":[]}'::jsonb;

-- Backfill source_name from existing view_name rows.
UPDATE "tb_report_template"
SET    "source_name" = "view_name",
       "source_type" = 'view'
WHERE  "source_name" IS NULL
  AND  "view_name"   IS NOT NULL
  AND  trim("view_name") <> '';

-- Allowed values only.
ALTER TABLE "tb_report_template"
  DROP CONSTRAINT IF EXISTS "tb_report_template_source_type_check";
ALTER TABLE "tb_report_template"
  ADD  CONSTRAINT "tb_report_template_source_type_check"
       CHECK ("source_type" IN ('view', 'function', 'procedure'));
