-- Base query for the "Deviation By Item" procurement report.
-- Row-level (one row per GRN detail item).

CREATE OR REPLACE VIEW v_procurement_deviation_by_item AS
SELECT
    COALESCE((SELECT po2.po_no FROM tb_purchase_order po2 WHERE po2.id = pod.purchase_order_id LIMIT 1), '')         AS po_no,
    grn.grn_no                                                                                                       AS rec_no,
    COALESCE(grn.invoice_no, '')                                                                                     AS inv_no,
    COALESCE(v.code, '')                                                                                             AS vendor_code,
    COALESCE(grn.vendor_name, v.name, '')                                                                            AS vendor_name,
    COALESCE(grnd.product_code, '')                                                                                  AS product_code,
    COALESCE(grnd.product_name, '')                                                                                  AS product_desc1,
    COALESCE(pod.order_qty, 0)                                                                                       AS po_qty,
    COALESCE(grndi.received_qty, 0)                                                                                  AS rec_qty,
    COALESCE(grndi.received_qty, 0) - COALESCE(pod.order_qty, 0)                                                     AS diff_qty,
    CASE WHEN COALESCE(pod.order_qty, 0) != 0
         THEN ((COALESCE(grndi.received_qty, 0) - pod.order_qty) / pod.order_qty * 100)
         ELSE 0 END                                                                                                  AS rec_dev_pct,
    0::numeric                                                                                                       AS allow_qty_dev_pct,
    COALESCE(pod.price, 0)                                                                                           AS po_price,
    CASE WHEN COALESCE(grndi.received_qty, 0) != 0
         THEN COALESCE(grndi.sub_total_price, 0) / grndi.received_qty
         ELSE 0 END                                                                                                  AS rec_price,
    CASE WHEN COALESCE(grndi.received_qty, 0) != 0
         THEN (COALESCE(grndi.sub_total_price, 0) / grndi.received_qty) - COALESCE(pod.price, 0)
         ELSE 0 END                                                                                                  AS diff_price,
    CASE WHEN COALESCE(pod.price, 0) != 0
         THEN ((CASE WHEN COALESCE(grndi.received_qty, 0) != 0
                     THEN grndi.sub_total_price / grndi.received_qty
                     ELSE 0 END - pod.price) / pod.price * 100)
         ELSE 0 END                                                                                                  AS price_dev_pct,
    0::numeric                                                                                                       AS allow_price_dev_pct,
    grn.grn_date                                                                                                     AS grn_date
FROM tb_good_received_note                    AS grn
JOIN tb_good_received_note_detail             AS grnd  ON grnd.good_received_note_id = grn.id
JOIN tb_good_received_note_detail_item        AS grndi ON grndi.good_received_note_detail_id = grnd.id AND grndi.deleted_at IS NULL
LEFT JOIN tb_vendor                           AS v     ON v.id = grn.vendor_id
LEFT JOIN tb_purchase_order_detail            AS pod   ON pod.product_id = grnd.product_id
                                                     AND pod.purchase_order_id IN (SELECT id FROM tb_purchase_order WHERE vendor_id = grn.vendor_id AND deleted_at IS NULL)
                                                     AND pod.deleted_at IS NULL
WHERE grn.deleted_at IS NULL;
