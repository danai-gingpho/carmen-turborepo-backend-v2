-- Base query for the "Inventory Movement Detailed" report (main grouped rows).
-- The builder also issues a separate "brought forward" (BF) query before the
-- caller-specified DateFrom cutoff; that BF slice is flagged as multi-query and
-- should be composed in application code because it depends on a filter date.
--
-- NOTE: transaction_type literals in the Go builder ('purchase', 'credit_note',
-- 'consumption', etc.) do not match the actual enum_transaction_type values on
-- this schema (good_received_note, credit_note_amount/quantity, issue, …).
-- The CASE expressions are cast via ::text so the query runs without enum
-- failure; the arms that reference non-existent labels simply match no rows.

CREATE OR REPLACE VIEW v_inventory_inventory_movement_detailed AS
SELECT
    l.name                                                                                                      AS location_name,
    p.code                                                                                                      AS product_code,
    COALESCE(p.name, '')                                                                                        AS product_desc1,
    COALESCE(p.inventory_unit_name, '')                                                                         AS unit,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'purchase'     THEN cl.in_qty  ELSE 0 END), 0)           AS rc_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'credit_note'  THEN cl.out_qty ELSE 0 END), 0)           AS cn_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'transfer_in'  THEN cl.in_qty  ELSE 0 END), 0)           AS transfer_in_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'transfer_out' THEN cl.out_qty ELSE 0 END), 0)           AS transfer_out_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'issue'        THEN cl.out_qty ELSE 0 END), 0)           AS issue_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'stock_in'     THEN cl.in_qty  ELSE 0 END), 0)           AS stock_in_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'stock_out'    THEN cl.out_qty ELSE 0 END), 0)           AS stock_out_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'adjustment'
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0) ELSE 0 END), 0)                     AS adj_qty,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'consumption'  THEN cl.out_qty ELSE 0 END), 0)           AS consumption_qty,
    l.code                                                                                                      AS location_code
FROM tb_inventory_transaction_cost_layer AS cl
JOIN tb_location AS l ON l.id = cl.location_id
JOIN tb_product  AS p ON p.id = cl.product_id
WHERE cl.deleted_at IS NULL
GROUP BY l.name, l.code, p.code, p.name, p.inventory_unit_name;
