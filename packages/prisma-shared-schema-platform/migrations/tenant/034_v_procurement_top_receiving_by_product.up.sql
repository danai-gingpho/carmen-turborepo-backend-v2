-- Base query for the "Top Receiving by Product" report.
-- NOTE: the Go builder aggregates SUM(0) and ROW_NUMBER() over it; preserved.

CREATE OR REPLACE VIEW v_procurement_top_receiving_by_product AS
SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(0) DESC)    AS rank_no,
    COALESCE(p.code, '')                        AS product_code,
    COALESCE(p.name, '')                        AS product_desc1,
    COALESCE(SUM(0), 0)                         AS total_amt
FROM tb_good_received_note_detail AS grnd
JOIN tb_good_received_note        AS grn ON grn.id = grnd.good_received_note_id
LEFT JOIN tb_product              AS p   ON p.id  = grnd.product_id
WHERE grn.deleted_at IS NULL
GROUP BY p.code, p.name;
