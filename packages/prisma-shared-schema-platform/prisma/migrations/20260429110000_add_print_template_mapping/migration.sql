-- Maps a document type (PO, PR, SR, GRN, CN, IA, …) to a tb_report_template
-- row used to render its print/preview output. One row per default template;
-- additional rows can register alternate templates surfaced in "Print as…".

CREATE TABLE IF NOT EXISTS "tb_print_template_mapping" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_type"       varchar(50) NOT NULL,
  "report_template_id"  uuid NOT NULL,
  "is_default"          boolean NOT NULL DEFAULT true,
  "display_label"       varchar(255),
  "display_order"       integer NOT NULL DEFAULT 0,
  "allow_business_unit" jsonb,
  "deny_business_unit"  jsonb,
  "is_active"           boolean NOT NULL DEFAULT true,
  "created_at"          timestamptz(6) DEFAULT now(),
  "created_by_id"       uuid,
  "updated_at"          timestamptz(6) DEFAULT now(),
  "updated_by_id"       uuid,
  "deleted_at"          timestamptz(6),
  "deleted_by_id"       uuid
);

CREATE INDEX IF NOT EXISTS "idx_print_template_mapping_document_type"
  ON "tb_print_template_mapping" ("document_type");
CREATE INDEX IF NOT EXISTS "idx_print_template_mapping_template_id"
  ON "tb_print_template_mapping" ("report_template_id");
