-- Base query for the "Stock Card Summary" report (main grouped rows).
-- The builder also issues a separate BF query (before as-of date); flagged as
-- multi-query — compose the BF slice in application code.

CREATE OR REPLACE VIEW v_inventory_stock_card_summary AS
SELECT
    p.code                                      AS product_code,
    COALESCE(p.name, '')                        AS product_desc1,
    l.code                                      AS location_code,
    COALESCE(l.name, '')                        AS location_name,
    COALESCE(p.inventory_unit_name, '')         AS unit,
    COALESCE(AVG(cl.average_cost_per_unit), 0)  AS cost_per_unit,
    COALESCE(SUM(cl.in_qty),  0)                AS in_qty,
    COALESCE(SUM(cl.out_qty), 0)                AS out_qty,
    cat.code                                    AS category_code,
    sc.code                                     AS sub_category_code,
    ig.code                                     AS item_group_code
FROM tb_inventory_transaction_cost_layer AS cl
JOIN tb_product  AS p ON p.id = cl.product_id  AND p.deleted_at IS NULL
JOIN tb_location AS l ON l.id = cl.location_id AND l.deleted_at IS NULL
LEFT JOIN tb_product_item_group   AS ig  ON ig.id = p.product_item_group_id   AND ig.deleted_at IS NULL
LEFT JOIN tb_product_sub_category AS sc  ON sc.id = ig.product_subcategory_id AND sc.deleted_at IS NULL
LEFT JOIN tb_product_category     AS cat ON cat.id = sc.product_category_id   AND cat.deleted_at IS NULL
WHERE cl.deleted_at IS NULL
GROUP BY p.code, p.name, l.code, l.name, p.inventory_unit_name, cat.code, sc.code, ig.code;
