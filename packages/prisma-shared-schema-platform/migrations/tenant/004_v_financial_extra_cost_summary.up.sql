-- Base query for the "Extra Cost Summary" financial report.

CREATE OR REPLACE VIEW v_financial_extra_cost_summary AS
SELECT
    COALESCE(ect.name, '')                                      AS type_id,
    COALESCE(ect.name, '')                                      AS type_name,
    ec.created_at                                               AS committed_date,
    COALESCE(grn.grn_no, '')                                    AS rec_no,
    COALESCE(grn.invoice_no, '')                                AS invoice_no,
    COALESCE(grn.grn_date, ec.created_at)                       AS rec_date,
    COALESCE(ecd.amount, 0)                                     AS amount,
    COALESCE(v.code, '')                                        AS vendor_code,
    COALESCE(v.name, '')                                        AS vendor_name
FROM tb_extra_cost_detail  AS ecd
JOIN tb_extra_cost         AS ec  ON ec.id  = ecd.extra_cost_id
LEFT JOIN tb_extra_cost_type AS ect ON ect.id = ecd.extra_cost_type_id
LEFT JOIN tb_good_received_note AS grn ON grn.id = ec.good_received_note_id
LEFT JOIN tb_vendor        AS v   ON v.id  = grn.vendor_id
WHERE ec.deleted_at IS NULL;
