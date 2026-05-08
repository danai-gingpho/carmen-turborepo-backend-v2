-- Base query for the "Inventory Aging" report.
-- Uses CURRENT_DATE as the as-of date; callers needing a different as-of date
-- should use the underlying cost layer directly (flagged: dynamic SQL in Go).

CREATE OR REPLACE VIEW v_inventory_inventory_aging AS
SELECT
    l.code                                                                  AS location_code,
    l.name                                                                  AS location_name,
    p.code                                                                  AS product_code,
    COALESCE(p.name, '')                                                    AS product_desc1,
    COALESCE(p.inventory_unit_name, '')                                     AS unit,
    COALESCE(SUM(COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)), 0)      AS on_hand,
    COALESCE(AVG(cl.average_cost_per_unit), 0)                              AS cost_per_unit,
    COALESCE(SUM((COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0))
                 * COALESCE(cl.average_cost_per_unit, 0)), 0)               AS amount,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - cl.lot_at_date::date) <= 30
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)
                      ELSE 0 END), 0)                                        AS days_30,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - cl.lot_at_date::date) > 30
                       AND (CURRENT_DATE - cl.lot_at_date::date) <= 60
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)
                      ELSE 0 END), 0)                                        AS days_60,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - cl.lot_at_date::date) > 60
                       AND (CURRENT_DATE - cl.lot_at_date::date) <= 90
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)
                      ELSE 0 END), 0)                                        AS days_90,
    COALESCE(SUM(CASE WHEN (CURRENT_DATE - cl.lot_at_date::date) > 90
                      THEN COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)
                      ELSE 0 END), 0)                                        AS days_over_90
FROM tb_inventory_transaction_cost_layer AS cl
JOIN tb_product  AS p ON p.id = cl.product_id  AND p.deleted_at IS NULL
JOIN tb_location AS l ON l.id = cl.location_id AND l.deleted_at IS NULL
WHERE cl.deleted_at IS NULL
GROUP BY l.code, l.name, p.code, p.name, p.inventory_unit_name
HAVING SUM(COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)) > 0;
