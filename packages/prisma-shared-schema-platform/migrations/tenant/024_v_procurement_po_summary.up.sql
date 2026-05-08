-- Base query for the "Purchase Order Summary" report.

CREATE OR REPLACE VIEW v_procurement_po_summary AS
SELECT
    po.po_no                                AS po_no,
    po.order_date                           AS po_date,
    po.po_status                            AS po_status,
    v.code                                  AS vendor_code,
    v.name                                  AS vendor_name,
    po.currency_code                        AS currency_code,
    po.total_qty                            AS total_qty,
    po.total_price                          AS total_price,
    po.total_tax                            AS total_tax,
    po.total_amount                         AS total_amount,
    po.buyer_name                           AS buyer_name
FROM tb_purchase_order AS po
LEFT JOIN tb_vendor    AS v ON v.id = po.vendor_id
WHERE po.deleted_at IS NULL;
