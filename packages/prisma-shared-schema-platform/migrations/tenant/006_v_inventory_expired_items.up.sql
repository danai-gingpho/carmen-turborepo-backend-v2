-- Base query for the "Expired Items" inventory report.
-- Row-level (not aggregated); caller applies date/location/category filters.

CREATE OR REPLACE VIEW v_inventory_expired_items AS
SELECT
    l.code                                                          AS location_code,
    l.name                                                          AS location_name,
    p.code                                                          AS product_code,
    COALESCE(p.name, '')                                            AS product_desc1,
    COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)                AS qty,
    COALESCE(p.inventory_unit_name, '')                             AS unit,
    cl.lot_at_date                                                  AS received_date,
    ''::text                                                        AS expired_date,
    cat.code                                                        AS category_code,
    sc.code                                                         AS sub_category_code,
    ig.code                                                         AS item_group_code,
    cl.created_at                                                   AS cl_created_at
FROM tb_inventory_transaction_cost_layer AS cl
JOIN tb_product      AS p   ON p.id = cl.product_id  AND p.deleted_at IS NULL
JOIN tb_location     AS l   ON l.id = cl.location_id AND l.deleted_at IS NULL
LEFT JOIN tb_product_item_group   AS ig  ON ig.id = p.product_item_group_id   AND ig.deleted_at IS NULL
LEFT JOIN tb_product_sub_category AS sc  ON sc.id = ig.product_subcategory_id AND sc.deleted_at IS NULL
LEFT JOIN tb_product_category     AS cat ON cat.id = sc.product_category_id   AND cat.deleted_at IS NULL
WHERE cl.deleted_at IS NULL
  AND (COALESCE(cl.in_qty, 0) - COALESCE(cl.out_qty, 0)) > 0;
