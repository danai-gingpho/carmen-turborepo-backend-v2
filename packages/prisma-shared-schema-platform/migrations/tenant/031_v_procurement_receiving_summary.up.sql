-- Base query for the "Receiving Summary" report.
-- NOTE: the Go builder joins tb_purchase_order with ON FALSE; preserved.

CREATE OR REPLACE VIEW v_procurement_receiving_summary AS
SELECT
    COALESCE(grn.doc_status::text, '')                          AS doc_status,
    grn.grn_no                                                  AS rec_no,
    COALESCE(po.po_no, '')                                      AS po_no,
    COALESCE(grn.invoice_no, '')                                AS invoice_no,
    COALESCE(grn.invoice_date, grn.grn_date)                    AS invoice_date,
    COALESCE(v.code, '')                                        AS sun_vendor_code,
    0::numeric                                                  AS sum_net,
    0::numeric                                                  AS sum_tax,
    0::numeric                                                  AS sum_total
FROM tb_good_received_note AS grn
LEFT JOIN tb_purchase_order AS po ON FALSE
LEFT JOIN tb_vendor         AS v  ON v.id = grn.vendor_id
WHERE grn.deleted_at IS NULL;
