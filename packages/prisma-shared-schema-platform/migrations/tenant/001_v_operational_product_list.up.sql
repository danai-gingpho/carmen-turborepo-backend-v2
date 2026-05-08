-- Base query for the "Product List" operational report.
-- Columns ending with `_code` are exposed for filter composition on the caller
-- side (e.g. `WHERE category_code BETWEEN ... AND ...`). Display columns are
-- computed here so the caller can project them directly without re-joining.

CREATE OR REPLACE VIEW v_operational_product_list AS
SELECT
    p.code                                                      AS product_code,
    COALESCE(p.name, '')                                        AS product_desc1,
    COALESCE(p.local_name, '')                                  AS product_desc2,
    cat.code                                                    AS category_code,
    COALESCE(cat.code || ' : ' || cat.name, '')                 AS category_name,
    sc.code                                                     AS sub_category_code,
    COALESCE(sc.code || ' : ' || sc.name, '')                   AS sub_category_name,
    ig.code                                                     AS item_group_code,
    COALESCE(ig.code || ' : ' || ig.name, '')                   AS item_group_name,
    COALESCE(p.inventory_unit_name, '')                         AS inventory_unit,
    COALESCE(uc.from_unit_name, p.inventory_unit_name, '')      AS order_unit,
    COALESCE(cl.cost_per_unit, 0)                               AS last_cost,
    COALESCE(p.tax_profile_name, '')                            AS tax_type_name,
    COALESCE(p.tax_rate, 0)                                     AS tax_rate,
    ''::text                                                    AS tax_acc_code,
    COALESCE(p.tax_rate::text, '')                              AS tax_type,
    CASE WHEN p.is_active THEN 'Active' ELSE 'Inactive' END     AS doc_status,
    p.is_active                                                 AS is_active
FROM tb_product AS p
LEFT JOIN tb_product_item_group     AS ig  ON ig.id = p.product_item_group_id       AND ig.deleted_at IS NULL
LEFT JOIN tb_product_sub_category   AS sc  ON sc.id = ig.product_subcategory_id     AND sc.deleted_at IS NULL
LEFT JOIN tb_product_category       AS cat ON cat.id = sc.product_category_id       AND cat.deleted_at IS NULL
LEFT JOIN tb_unit_conversion        AS uc  ON uc.product_id = p.id AND uc.is_default = true AND uc.deleted_at IS NULL
LEFT JOIN LATERAL (
    SELECT cost_per_unit
    FROM tb_inventory_transaction_cost_layer
    WHERE product_id = p.id AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
) AS cl ON true
WHERE p.deleted_at IS NULL;
