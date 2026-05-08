-- Base query for the "Top Receiving by Vendor" report.
-- NOTE: the Go builder aggregates SUM(0); preserved.

CREATE OR REPLACE VIEW v_procurement_top_receiving_by_vendor AS
SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(0) DESC)    AS rank_no,
    COALESCE(v.code, '')                        AS vendor_code,
    COALESCE(v.name, '')                        AS vendor_name,
    COALESCE(SUM(0), 0)                         AS total_amt
FROM tb_good_received_note AS grn
LEFT JOIN tb_vendor        AS v ON v.id = grn.vendor_id
WHERE grn.deleted_at IS NULL
GROUP BY v.code, v.name;
