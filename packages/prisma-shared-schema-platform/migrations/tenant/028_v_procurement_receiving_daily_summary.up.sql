-- Base query for the "Receiving Daily Detailed Summary Report" (by location type).
-- NOTE: the Go builder joins tb_location with ON FALSE and uses COALESCE(0,0)
-- placeholders for totals. Preserved verbatim.

CREATE OR REPLACE VIEW v_procurement_receiving_daily_summary AS
SELECT
    COALESCE(grn.doc_status::text, '')                          AS doc_status,
    grn.grn_no                                                  AS rec_no,
    COALESCE(grn.invoice_no, '')                                AS invoice_no,
    COALESCE(grn.invoice_date, grn.grn_date)                    AS invoice_date,
    COALESCE(v.code, '')                                        AS sun_vendor_code,
    COALESCE(l.name, '')                                        AS location_name,
    COALESCE(l.location_type::text, '')                         AS eop,
    COALESCE(l.location_type::text, '')                         AS eop_name,
    0::numeric                                                  AS sum_net,
    0::numeric                                                  AS sum_tax,
    0::numeric                                                  AS sum_total
FROM tb_good_received_note AS grn
LEFT JOIN tb_vendor   AS v ON v.id = grn.vendor_id
LEFT JOIN tb_location AS l ON FALSE
WHERE grn.deleted_at IS NULL;
