-- Base query for the "Inventory Movement Summary" report (main grouped rows).
-- The builder also runs a separate BF query conditional on DateFrom; flagged as
-- multi-query — compose BF in application code.
--
-- NOTE: transaction_type literals are cast via ::text for the same reason as
-- v_inventory_inventory_movement_detailed.

CREATE OR REPLACE VIEW v_inventory_inventory_movement_summary AS
SELECT
    l.name                                                                                                                      AS location_name,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'purchase'
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0) ELSE 0 END), 0)                                     AS purchasing,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'credit_note'
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0) ELSE 0 END), 0)                                     AS credit_note,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'transfer_in'  THEN COALESCE(cl.in_qty, 0)  ELSE 0 END), 0)              AS transfer_in,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'transfer_out' THEN COALESCE(cl.out_qty, 0) ELSE 0 END), 0)              AS transfer_out,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'stock_in'     THEN COALESCE(cl.in_qty, 0)  ELSE 0 END), 0)              AS stock_in,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'stock_out'    THEN COALESCE(cl.out_qty, 0) ELSE 0 END), 0)              AS stock_out,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'issue'        THEN COALESCE(cl.out_qty, 0) ELSE 0 END), 0)              AS issue,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'adjustment'
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0) ELSE 0 END), 0)                                     AS diff,
    COALESCE(SUM(CASE WHEN cl.transaction_type::text = 'consumption'  THEN COALESCE(cl.out_qty, 0) ELSE 0 END), 0)              AS consumption,
    l.code                                                                                                                      AS location_code
FROM tb_inventory_transaction_cost_layer AS cl
JOIN tb_location AS l ON l.id = cl.location_id
WHERE cl.deleted_at IS NULL
GROUP BY l.name, l.code;
