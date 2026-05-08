-- Base query for the "Transaction Summary" report.
-- NOTE: the Go builder has two suspicious self-joins on tb_location using the
-- same itd.location_id for both "from" and "to" and categories joined against
-- product_item_group_id (not category_id). Preserved verbatim — flagged for
-- review.

CREATE OR REPLACE VIEW v_inventory_transaction_summary AS
SELECT
    COALESCE(fl.code, '')                       AS location_code,
    COALESCE(fl.name, '')                       AS location_name,
    COALESCE(tl.code, '')                       AS to_location_code,
    COALESCE(tl.name, '')                       AS to_location_name,
    COALESCE(c.code, '')                        AS category_code,
    COALESCE(c.name, '')                        AS category_name,
    COALESCE(sc.name, '')                       AS sub_cate_name,
    COALESCE(SUM(itd.total_cost), 0)            AS net_amt,
    0::numeric                                  AS tax_amt,
    COALESCE(SUM(itd.total_cost), 0)            AS total_amt
FROM tb_inventory_transaction_detail AS itd
JOIN tb_inventory_transaction        AS it ON it.id = itd.inventory_transaction_id
LEFT JOIN tb_location                AS fl ON fl.id = itd.location_id
LEFT JOIN tb_location                AS tl ON tl.id = itd.location_id
LEFT JOIN tb_product                 AS p  ON p.id  = itd.product_id
LEFT JOIN tb_product_category        AS c  ON c.id  = p.product_item_group_id
LEFT JOIN tb_product_sub_category    AS sc ON sc.id = p.product_item_group_id
WHERE it.deleted_at IS NULL
GROUP BY fl.code, fl.name, tl.code, tl.name, c.code, c.name, sc.name;
