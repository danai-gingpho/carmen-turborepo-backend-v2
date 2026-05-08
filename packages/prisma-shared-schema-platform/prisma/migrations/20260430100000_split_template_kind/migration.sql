-- Split tb_report_template into report vs print kinds.
-- See micro-report/migrations/006_add_template_kind.up.sql for the canonical
-- reasoning. Both files must apply the same DDL — keep them in sync.

ALTER TABLE "CARMEN_SYSTEM".tb_report_template
    ADD COLUMN IF NOT EXISTS "kind" VARCHAR(20) NOT NULL DEFAULT 'report';

UPDATE "CARMEN_SYSTEM".tb_report_template
   SET kind = 'print'
 WHERE RIGHT(report_group, 4) = '_DOC';

UPDATE "CARMEN_SYSTEM".tb_report_template
   SET report_group = LEFT(report_group, LENGTH(report_group) - 4)
 WHERE kind = 'print'
   AND RIGHT(report_group, 4) = '_DOC';

ALTER TABLE "CARMEN_SYSTEM".tb_report_template
    ADD CONSTRAINT tb_report_template_kind_check
        CHECK (kind IN ('report', 'print'));

CREATE INDEX IF NOT EXISTS idx_report_template_kind
    ON "CARMEN_SYSTEM".tb_report_template (kind)
    WHERE deleted_at IS NULL;
