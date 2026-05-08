-- Base query for the "Stock Card Detailed" report.

CREATE OR REPLACE VIEW v_inventory_stock_card_detailed AS
SELECT
    p.code                                                          AS product_code,
    p.name                                                          AS product_desc1,
    l.code                                                          AS location_code,
    l.name                                                          AS location_name,
    it.inventory_doc_type                                           AS doc_type,
    it.inventory_doc_no                                             AS hdr_no,
    it.created_at                                                   AS doc_date,
    it.created_at                                                   AS committed_date,
    CASE WHEN itd.qty > 0 THEN itd.qty ELSE 0 END                   AS in_qty,
    CASE WHEN itd.qty < 0 THEN ABS(itd.qty) ELSE 0 END              AS out_qty,
    itd.qty                                                         AS net_qty,
    itd.total_cost                                                  AS amount,
    itd.cost_per_unit                                               AS unit_cost,
    COALESCE(itd.cost_per_unit, 0)                                  AS base_cost,
    COALESCE(p.inventory_unit_name, '')                             AS inventory_unit,
    ''::text                                                        AS adj_code
FROM tb_inventory_transaction_detail AS itd
JOIN tb_inventory_transaction        AS it ON it.id = itd.inventory_transaction_id
LEFT JOIN tb_product                 AS p  ON p.id  = itd.product_id
LEFT JOIN tb_location                AS l  ON l.id  = itd.location_id
WHERE it.deleted_at IS NULL;
