-- Base query for the "Stock Out Detail" report.

CREATE OR REPLACE VIEW v_inventory_stock_out_detail AS
SELECT
    p.code                                                  AS sku,
    p.name                                                  AS product_desc1,
    l.name                                                  AS location_name,
    COALESCE(p.inventory_unit_name, '')                     AS unit,
    ABS(itd.qty)                                            AS qty,
    itd.cost_per_unit                                       AS unit_cost,
    ''::text                                                AS adj_name,
    COALESCE(it.note, '')                                   AS description,
    ''::text                                                AS status,
    it.created_at                                           AS create_date,
    it.created_at                                           AS commit_date,
    ''::text                                                AS ref_id,
    l.code                                                  AS location_code,
    p.code                                                  AS product_code,
    p.product_item_group_id                                 AS product_item_group_id
FROM tb_inventory_transaction_detail AS itd
JOIN tb_inventory_transaction        AS it ON it.id = itd.inventory_transaction_id
LEFT JOIN tb_product                 AS p  ON p.id  = itd.product_id
LEFT JOIN tb_location                AS l  ON l.id  = itd.location_id
WHERE it.deleted_at IS NULL
  AND itd.qty < 0;
