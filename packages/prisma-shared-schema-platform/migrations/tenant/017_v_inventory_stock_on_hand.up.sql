-- Base query for the "Stock On Hand" report.

CREATE OR REPLACE VIEW v_inventory_stock_on_hand AS
SELECT
    p.code                                                  AS product_code,
    p.name                                                  AS product_name,
    l.code                                                  AS location_code,
    l.name                                                  AS location_name,
    COALESCE(SUM(itd.qty), 0)                               AS qty_on_hand,
    COALESCE(SUM(itd.total_cost), 0)                        AS total_cost,
    CASE WHEN COALESCE(SUM(itd.qty), 0) = 0 THEN 0
         ELSE COALESCE(SUM(itd.total_cost), 0) / SUM(itd.qty)
    END                                                     AS avg_unit_cost
FROM tb_inventory_transaction_detail AS itd
JOIN tb_inventory_transaction        AS it ON it.id = itd.inventory_transaction_id
LEFT JOIN tb_product                 AS p  ON p.id  = itd.product_id
LEFT JOIN tb_location                AS l  ON l.id  = itd.location_id
WHERE it.deleted_at IS NULL
GROUP BY p.code, p.name, l.code, l.name;
