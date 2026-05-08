-- Move orientation + signature configuration onto tb_report_template so the
-- print pipeline no longer has to read tb_application_config (orientation) or
-- walk the workflow stages (signatures). Backfill existing rows by reading
-- the legacy "Document Landscape" suffix.

ALTER TABLE "tb_report_template"
  ADD COLUMN IF NOT EXISTS "orientation"      VARCHAR(20) NOT NULL DEFAULT 'portrait',
  ADD COLUMN IF NOT EXISTS "signature_config" JSONB        NOT NULL DEFAULT '{"blocks":[]}'::jsonb;

ALTER TABLE "tb_report_template"
  DROP CONSTRAINT IF EXISTS "tb_report_template_orientation_check";
ALTER TABLE "tb_report_template"
  ADD  CONSTRAINT "tb_report_template_orientation_check"
       CHECK ("orientation" IN ('portrait','landscape'));

-- Backfill existing _DOC templates: detect the "Landscape" suffix.
UPDATE "tb_report_template"
SET    "orientation" = 'landscape'
WHERE  ("name" ILIKE '%Landscape')
   AND "orientation" = 'portrait'
   AND "deleted_at" IS NULL;
