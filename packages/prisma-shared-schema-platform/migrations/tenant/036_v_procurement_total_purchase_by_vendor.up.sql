-- Base query for the "Total Purchase by Vendor" report.
-- NOTE: the Go builder joins tb_location with ON FALSE and uses COALESCE(0,0)
-- placeholders for totals. Preserved verbatim.

CREATE OR REPLACE VIEW v_procurement_total_purchase_by_vendor AS
SELECT
    COALESCE(v.code, '')                                AS vendor_code,
    COALESCE(l.name, '')                                AS location_name,
    grn.grn_no                                          AS rec_no,
    grn.grn_date                                        AS rec_date,
    COALESCE(grn.invoice_no, '')                        AS invoice_no,
    COALESCE(grn.invoice_date, grn.grn_date)            AS invoice_date,
    COALESCE(grn.doc_status::text, '')                  AS status,
    ''::text                                            AS export_status,
    0::numeric                                          AS discount,
    0::numeric                                          AS total_net,
    0::numeric                                          AS total_tax,
    0::numeric                                          AS total_amt
FROM tb_good_received_note AS grn
LEFT JOIN tb_vendor   AS v ON v.id = grn.vendor_id
LEFT JOIN tb_location AS l ON FALSE
WHERE grn.deleted_at IS NULL;
