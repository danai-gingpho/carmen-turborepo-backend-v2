-- Base query for the "Purchase Analysis By Item" report.

CREATE OR REPLACE VIEW v_procurement_purchase_analysis_by_item AS
SELECT
    COALESCE(grnd.product_code, p.code, '')                     AS product_code,
    COALESCE(grnd.product_name, p.name, '')                     AS product_desc1,
    COALESCE(price_range.highest_price, 0)                      AS highest_price,
    COALESCE(price_range.lowest_price,  0)                      AS lowest_price,
    COALESCE(v.code, '')                                        AS vendor_code,
    COALESCE(grn.vendor_name, v.name, '')                       AS vendor_name,
    grn.grn_no                                                  AS rec_no,
    grn.grn_date                                                AS rec_date,
    COALESCE(grnd.location_name, '')                            AS location_name,
    COALESCE(grnd.location_code, '')                            AS location_code,
    COALESCE(grndi.received_qty, 0)                             AS qty,
    COALESCE(grndi.received_unit_name, p.inventory_unit_name, '') AS unit,
    COALESCE(grndi.base_price, 0)                               AS price,
    COALESCE(grndi.discount_amount, 0)                          AS discount,
    COALESCE(grndi.base_net_amount, grndi.net_amount, 0)        AS net_amt,
    COALESCE(grndi.tax_amount, 0)                               AS tax_amt,
    COALESCE(grndi.base_total_price, grndi.total_price, 0)      AS total_amt
FROM tb_good_received_note                 AS grn
JOIN tb_good_received_note_detail          AS grnd  ON grnd.good_received_note_id = grn.id
JOIN tb_good_received_note_detail_item     AS grndi ON grndi.good_received_note_detail_id = grnd.id AND grndi.deleted_at IS NULL
LEFT JOIN tb_vendor                        AS v     ON v.id = grn.vendor_id
LEFT JOIN tb_product                       AS p     ON p.id = grnd.product_id AND p.deleted_at IS NULL
LEFT JOIN LATERAL (
    SELECT MAX(grndi2.base_price) AS highest_price, MIN(grndi2.base_price) AS lowest_price
    FROM tb_good_received_note_detail AS grnd2
    JOIN tb_good_received_note_detail_item AS grndi2 ON grndi2.good_received_note_detail_id = grnd2.id AND grndi2.deleted_at IS NULL
    WHERE grnd2.product_id = grnd.product_id
) AS price_range ON true
WHERE grn.deleted_at IS NULL;
