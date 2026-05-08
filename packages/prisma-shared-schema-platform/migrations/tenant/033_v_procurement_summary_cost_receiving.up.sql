-- Base query for the "Summary Cost Receiving" report.
-- NOTE: the Go builder joins tb_location with ON FALSE and uses SUM(0)
-- placeholders for every numeric aggregate. Preserved verbatim.

CREATE OR REPLACE VIEW v_procurement_summary_cost_receiving AS
SELECT
    COALESCE(p.code, '')                                                    AS product_code,
    COALESCE(p.name, '')                                                    AS product_desc1,
    COALESCE(l.code, '')                                                    AS location_code,
    COALESCE(l.name, '')                                                    AS location_name,
    COALESCE(p.inventory_unit_name, '')                                     AS unit_code,
    COALESCE(SUM(0), 0)                                                     AS rec_qty,
    CASE WHEN COALESCE(SUM(0), 0) = 0 THEN 0
         ELSE COALESCE(SUM(0), 0) / SUM(0) END                              AS unit_cost,
    COALESCE(SUM(0), 0)                                                     AS net_amt,
    COALESCE(SUM(0), 0)                                                     AS tax_amt,
    COALESCE(SUM(0), 0)                                                     AS total_amt
FROM tb_good_received_note_detail AS grnd
JOIN tb_good_received_note        AS grn ON grn.id = grnd.good_received_note_id
LEFT JOIN tb_product              AS p   ON p.id  = grnd.product_id
LEFT JOIN tb_location             AS l   ON FALSE
WHERE grn.deleted_at IS NULL
GROUP BY p.code, p.name, l.code, l.name, p.inventory_unit_name;
