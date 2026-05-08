-- Base query for the "Inventory Balance" report.

CREATE OR REPLACE VIEW v_inventory_inventory_balance AS
SELECT
    p.code                                                      AS product_code,
    p.name                                                      AS product_desc1,
    l.code                                                      AS location_code,
    l.name                                                      AS location_name,
    COALESCE(p.inventory_unit_name, '')                         AS inventory_unit,
    COALESCE(SUM(itd.qty), 0)                                   AS net_qty,
    COALESCE(SUM(itd.total_cost), 0)                            AS amount,
    CASE WHEN COALESCE(SUM(itd.qty), 0) = 0 THEN 0
         ELSE COALESCE(SUM(itd.total_cost), 0) / SUM(itd.qty)
    END                                                         AS unit_cost,
    0::numeric                                                  AS min_qty,
    0::numeric                                                  AS max_qty
FROM tb_inventory_transaction_detail AS itd
JOIN tb_inventory_transaction        AS it ON it.id = itd.inventory_transaction_id
LEFT JOIN tb_product                 AS p  ON p.id  = itd.product_id
LEFT JOIN tb_location                AS l  ON l.id  = itd.location_id
WHERE it.deleted_at IS NULL
GROUP BY p.code, p.name, l.code, l.name, p.inventory_unit_name;
