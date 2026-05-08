-- Base query for the "Stock Movement" report.

CREATE OR REPLACE VIEW v_inventory_stock_movement AS
SELECT
    it.inventory_doc_type                   AS inventory_doc_type,
    p.code                                  AS product_code,
    p.name                                  AS product_name,
    l.code                                  AS location_code,
    l.name                                  AS location_name,
    itd.qty                                 AS qty,
    itd.cost_per_unit                       AS cost_per_unit,
    itd.total_cost                          AS total_cost,
    it.created_at                           AS created_at
FROM tb_inventory_transaction_detail AS itd
JOIN tb_inventory_transaction        AS it ON it.id = itd.inventory_transaction_id
LEFT JOIN tb_product                 AS p  ON p.id  = itd.product_id
LEFT JOIN tb_location                AS l  ON l.id  = itd.location_id
WHERE it.deleted_at IS NULL;
