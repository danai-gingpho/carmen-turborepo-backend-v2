-- Base query for the "Slow Moving" inventory report.
-- The day-threshold / as-of-date comparison is dynamic in the builder
-- (CURRENT_DATE by default, or an override); the view exposes last_active_date
-- and on_hand so callers can apply the date arithmetic themselves.

CREATE OR REPLACE VIEW v_inventory_slow_moving AS
SELECT
    l.code                                  AS location_code,
    l.name                                  AS location_name,
    p.code                                  AS product_code,
    COALESCE(p.name, '')                    AS product_desc1,
    sub.last_active_date                    AS last_active_date,
    ''::text                                AS last_active_type,
    COALESCE(p.inventory_unit_name, '')     AS unit,
    sub.on_hand                             AS on_hand,
    sub.cost_per_unit                       AS cost_per_unit,
    sub.on_hand * sub.cost_per_unit         AS amount
FROM (
    SELECT cl.location_id, cl.product_id,
           MAX(cl.created_at)                                                       AS last_active_date,
           COALESCE(SUM(COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)), 0)       AS on_hand,
           COALESCE(AVG(cl.average_cost_per_unit), 0)                               AS cost_per_unit
    FROM tb_inventory_transaction_cost_layer AS cl
    WHERE cl.deleted_at IS NULL
    GROUP BY cl.location_id, cl.product_id
    HAVING SUM(COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)) > 0
) AS sub
JOIN tb_product  AS p ON p.id = sub.product_id  AND p.deleted_at IS NULL
JOIN tb_location AS l ON l.id = sub.location_id AND l.deleted_at IS NULL;
