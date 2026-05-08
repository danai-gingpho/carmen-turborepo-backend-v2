-- Base query for the "Product Category" operational report.
-- Exposes *_code columns for filter composition and display names for direct
-- projection by the caller.

CREATE OR REPLACE VIEW v_operational_product_category AS
SELECT
    cat.code                    AS category_code,
    COALESCE(cat.name, '')      AS category_name,
    sc.code                     AS sub_category_code,
    COALESCE(sc.name, '')       AS sub_category_name,
    ig.code                     AS item_group_code,
    COALESCE(ig.name, '')       AS item_group_name
FROM tb_product_item_group    AS ig
JOIN tb_product_sub_category  AS sc  ON sc.id = ig.product_subcategory_id AND sc.deleted_at IS NULL
JOIN tb_product_category      AS cat ON cat.id = sc.product_category_id    AND cat.deleted_at IS NULL
WHERE ig.deleted_at IS NULL;
