-- Base query for the "Purchase Order By Department" report.
-- NOTE: the Go builder includes LEFT JOINs on tb_location and tb_purchase_request
-- with `ON FALSE`, preserved verbatim. These joins produce NULL columns but do
-- not affect row count.

CREATE OR REPLACE VIEW v_procurement_po_by_department AS
SELECT
    COALESCE(l.code, '')                                            AS location,
    COALESCE(l.name, '')                                            AS location_name,
    COALESCE(po.buyer_name, '')                                     AS created_by,
    po.po_no                                                        AS po_no,
    po.order_date                                                   AS po_date,
    COALESCE(pr.pr_no, '')                                          AS pr_no,
    COALESCE(po.delivery_date, po.order_date)                       AS delivery_date,
    po.po_status                                                    AS doc_status,
    COALESCE(grn.grn_no, '')                                        AS rec_no,
    COALESCE(p.code, '')                                            AS product,
    COALESCE(p.name, '')                                            AS product_desc1,
    COALESCE(pod.order_unit_name, '')                               AS order_unit,
    COALESCE(pod.order_qty, 0)                                      AS order_qty,
    COALESCE(pod.price, 0)                                          AS price,
    COALESCE(pod.received_qty, 0)                                   AS rec_qty,
    COALESCE(pod.net_amount, 0)                                     AS net_amt,
    COALESCE(pod.tax_amount, 0)                                     AS tax_amt,
    COALESCE(pod.discount_amount, 0)                                AS discount,
    COALESCE(pod.total_price, 0)                                    AS total_amt
FROM tb_purchase_order_detail AS pod
JOIN tb_purchase_order        AS po ON po.id = pod.purchase_order_id
LEFT JOIN tb_location         AS l  ON FALSE
LEFT JOIN tb_product          AS p  ON p.id = pod.product_id
LEFT JOIN tb_purchase_request AS pr ON FALSE
LEFT JOIN tb_good_received_note_detail AS grnd ON grnd.purchase_order_id = po.id
LEFT JOIN tb_good_received_note        AS grn  ON grn.id = grnd.good_received_note_id AND grn.deleted_at IS NULL
WHERE po.deleted_at IS NULL;
