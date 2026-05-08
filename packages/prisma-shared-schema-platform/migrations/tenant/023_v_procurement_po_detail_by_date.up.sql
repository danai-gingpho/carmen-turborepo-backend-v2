-- Base query for the "Purchase Order Detail by Date" report.
-- NOTE: Same ON FALSE joins to location and purchase_request preserved from the
-- Go builder.

CREATE OR REPLACE VIEW v_procurement_po_detail_by_date AS
SELECT
    po.po_no                                                AS po_no,
    po.order_date                                           AS po_date,
    COALESCE(po.description, '')                            AS po_desc,
    COALESCE(po.delivery_date, po.order_date)               AS delivery_date,
    po.po_status                                            AS doc_status,
    COALESCE(po.buyer_name, '')                             AS created_by,
    COALESCE(v.code, '')                                    AS vendor_code,
    COALESCE(v.name, '')                                    AS vendor_name,
    COALESCE(l.code, '')                                    AS location_code,
    COALESCE(l.name, '')                                    AS location_name,
    COALESCE(pr.pr_no, '')                                  AS pr_no,
    COALESCE(grn.grn_no, '')                                AS rec_no,
    COALESCE(p.code, '')                                    AS product_code,
    COALESCE(p.name, '')                                    AS product_desc1,
    COALESCE(pod.order_unit_name, '')                       AS order_unit,
    COALESCE(pod.order_qty, 0)                              AS order_qty,
    COALESCE(pod.price, 0)                                  AS price,
    COALESCE(pod.received_qty, 0)                           AS rec_qty,
    COALESCE(po.currency_code, '')                          AS currency_code,
    COALESCE(po.exchange_rate, 1)                           AS currency_rate,
    COALESCE(pod.net_amount, 0)                             AS curr_net_amt,
    COALESCE(pod.tax_amount, 0)                             AS curr_tax_amt,
    COALESCE(pod.discount_amount, 0)                        AS curr_disc_amt,
    COALESCE(pod.total_price, 0)                            AS curr_total_amt
FROM tb_purchase_order_detail AS pod
JOIN tb_purchase_order        AS po ON po.id = pod.purchase_order_id
LEFT JOIN tb_vendor           AS v  ON v.id = po.vendor_id
LEFT JOIN tb_location         AS l  ON FALSE
LEFT JOIN tb_product          AS p  ON p.id = pod.product_id
LEFT JOIN tb_purchase_request AS pr ON FALSE
LEFT JOIN tb_good_received_note_detail AS grnd ON grnd.purchase_order_id = po.id
LEFT JOIN tb_good_received_note        AS grn  ON grn.id = grnd.good_received_note_id AND grn.deleted_at IS NULL
WHERE po.deleted_at IS NULL;
