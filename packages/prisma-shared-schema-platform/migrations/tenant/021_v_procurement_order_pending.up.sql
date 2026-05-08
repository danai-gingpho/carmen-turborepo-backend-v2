-- Base query for the "Order Pending" procurement report.
-- NOTE: the Go builder references pod.location_id, which does not exist on
-- tb_purchase_order_detail. We substitute an always-false join (NULL location)
-- so the row count remains one row per matching pod with pending qty > 0.

CREATE OR REPLACE VIEW v_procurement_order_pending AS
SELECT
    po.po_no                                                                                AS po_no,
    po.order_date                                                                           AS po_date,
    po.delivery_date                                                                        AS delivery_date,
    COALESCE(pod.product_code, '')                                                          AS product_code,
    COALESCE(pod.product_name, '')                                                          AS product_desc1,
    COALESCE(l.code, '')                                                                    AS location_code,
    COALESCE(l.name, '')                                                                    AS location_name,
    COALESCE(pod.order_qty, 0)                                                              AS order_qty,
    COALESCE(pod.received_qty, 0)                                                           AS rec_qty,
    COALESCE(pod.order_qty, 0) - COALESCE(pod.received_qty, 0)                              AS pending_qty,
    COALESCE(pod.price, 0)                                                                  AS price,
    (COALESCE(pod.order_qty, 0) - COALESCE(pod.received_qty, 0)) * COALESCE(pod.price, 0)   AS pending_price,
    COALESCE(po.po_status::text, '')                                                        AS doc_status,
    COALESCE(v.code, '')                                                                    AS vendor_code,
    COALESCE(po.vendor_name, v.name, '')                                                    AS vendor_name
FROM tb_purchase_order AS po
JOIN tb_purchase_order_detail AS pod ON pod.purchase_order_id = po.id AND pod.deleted_at IS NULL
LEFT JOIN tb_vendor   AS v ON v.id = po.vendor_id
LEFT JOIN tb_location AS l ON FALSE
WHERE po.deleted_at IS NULL
  AND COALESCE(pod.order_qty, 0) - COALESCE(pod.received_qty, 0) > 0;
