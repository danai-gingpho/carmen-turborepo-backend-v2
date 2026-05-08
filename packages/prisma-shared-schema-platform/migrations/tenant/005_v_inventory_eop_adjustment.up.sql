-- Base query for the "EOP Adjustment" inventory report.
-- Exposes period_snapshot rows; callers can filter by period_id, location_code,
-- product_code.

CREATE OR REPLACE VIEW v_inventory_eop_adjustment AS
SELECT
    COALESCE(ps.location_code, '')          AS location_code,
    COALESCE(ps.location_name, '')          AS location_name,
    COALESCE(ps.product_code, '')           AS product_code,
    COALESCE(ps.product_name, '')           AS product_name,
    COALESCE(ps.product_local_name, '')     AS product_local_name,
    COALESCE(ps.product_sku, '')            AS product_sku,
    COALESCE(ps.lot_no, '')                 AS lot_no,
    COALESCE(ps.adjustment_qty, 0)          AS adjustment_qty,
    COALESCE(ps.adjustment_total_cost, 0)   AS adjustment_total_cost,
    COALESCE(ps.opening_qty, 0)             AS opening_qty,
    COALESCE(ps.opening_total_cost, 0)      AS opening_total_cost,
    COALESCE(ps.closing_qty, 0)             AS closing_qty,
    COALESCE(ps.closing_total_cost, 0)      AS closing_total_cost,
    COALESCE(ps.closing_cost_per_unit, 0)   AS closing_cost_per_unit,
    ps.period_id                            AS period_id
FROM tb_period_snapshot AS ps
WHERE ps.deleted_at IS NULL;
