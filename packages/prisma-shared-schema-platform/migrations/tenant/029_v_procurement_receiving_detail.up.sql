-- Base query for the "Receiving Detail" report.

CREATE OR REPLACE VIEW v_procurement_receiving_detail AS
SELECT
    COALESCE(grnd.location_name, '')                                                            AS location_name,
    COALESCE(grnd.location_code, '')                                                            AS location_code,
    grn.grn_no                                                                                  AS rec_no,
    grn.grn_date                                                                                AS rec_date,
    COALESCE(grn.invoice_no, '')                                                                AS inv_no,
    COALESCE(v.code, '')                                                                        AS vendor_code,
    COALESCE(grn.vendor_name, v.name, '')                                                       AS vendor_name,
    COALESCE(grnd.product_code, p.code, '')                                                     AS product_code,
    COALESCE(grnd.product_name, p.name, '')                                                     AS product_desc1,
    ''::text                                                                                    AS dept_code,
    ''::text                                                                                    AS acc_code,
    COALESCE(grndi.received_unit_name, p.inventory_unit_name, '')                               AS unit,
    COALESCE(grndi.received_qty, 0)                                                             AS qty,
    CASE WHEN COALESCE(grndi.received_qty, 0) != 0
         THEN COALESCE(grndi.sub_total_price, 0) / grndi.received_qty
         ELSE 0 END                                                                             AS cost_per_unit,
    COALESCE(grndi.net_amount, 0)                                                               AS amt_ex_tax,
    COALESCE(grndi.tax_amount, 0)                                                               AS tax_amt,
    COALESCE(grndi.total_price, 0)                                                              AS amount
FROM tb_good_received_note            AS grn
JOIN tb_good_received_note_detail     AS grnd  ON grnd.good_received_note_id = grn.id
JOIN tb_good_received_note_detail_item AS grndi ON grndi.good_received_note_detail_id = grnd.id AND grndi.deleted_at IS NULL
LEFT JOIN tb_vendor                   AS v     ON v.id = grn.vendor_id
LEFT JOIN tb_product                  AS p     ON p.id = grnd.product_id AND p.deleted_at IS NULL
WHERE grn.deleted_at IS NULL;
