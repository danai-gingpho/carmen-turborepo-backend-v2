-- Base query for the "Material Consumption" report.
--
-- NOTE: the Go builder filters on transaction_type = 'consumption', but that
-- label is not present in enum_transaction_type on this schema. The predicate
-- is cast via ::text so the view compiles; it simply returns zero rows until
-- the enum contains that label.

CREATE OR REPLACE VIEW v_inventory_material_consumption AS
SELECT
    p.code                                      AS product_code,
    COALESCE(p.name, '')                        AS product_desc1,
    ''::text                                    AS recipe_qty,
    ''::text                                    AS recipe_unit,
    COALESCE(SUM(cl.out_qty), 0)                AS inventory_qty,
    COALESCE(p.inventory_unit_name, '')         AS inventory_unit,
    COALESCE(AVG(cl.cost_per_unit), 0)          AS cost_per_unit,
    COALESCE(SUM(cl.total_cost), 0)             AS total_cost,
    l.code                                      AS location_code,
    COALESCE(l.name, '')                        AS location_name
FROM tb_inventory_transaction_cost_layer AS cl
JOIN tb_product  AS p ON p.id = cl.product_id  AND p.deleted_at IS NULL
JOIN tb_location AS l ON l.id = cl.location_id AND l.deleted_at IS NULL
WHERE cl.deleted_at IS NULL
  AND cl.transaction_type::text = 'consumption'
GROUP BY p.code, p.name, p.inventory_unit_name, l.code, l.name;
