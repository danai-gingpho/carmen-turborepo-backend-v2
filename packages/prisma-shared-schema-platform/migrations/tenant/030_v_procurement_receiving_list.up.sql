-- Base query for the "Receiving List" report.

CREATE OR REPLACE VIEW v_procurement_receiving_list AS
SELECT
    grn.grn_no                                  AS rec_no,
    grn.grn_date                                AS rec_date,
    COALESCE(grn.invoice_no, '')                AS inv_no,
    COALESCE(grn.invoice_date, grn.grn_date)    AS inv_date,
    COALESCE(v.code, '')                        AS vendor_code,
    COALESCE(grn.vendor_name, v.name, '')       AS vendor_name,
    COALESCE(grn.currency_code, '')             AS currency_code,
    COALESCE(items.net_amt,   0)                AS net_amt,
    COALESCE(items.tax_amt,   0)                AS tax_amt,
    COALESCE(items.total_amt, 0)                AS total_amt,
    0::numeric                                  AS extra_cost_amt,
    COALESCE(grn.doc_status::text, '')          AS doc_status
FROM tb_good_received_note AS grn
LEFT JOIN tb_vendor AS v ON v.id = grn.vendor_id
LEFT JOIN LATERAL (
    SELECT
        COALESCE(SUM(grndi.net_amount),  0) AS net_amt,
        COALESCE(SUM(grndi.tax_amount),  0) AS tax_amt,
        COALESCE(SUM(grndi.total_price), 0) AS total_amt
    FROM tb_good_received_note_detail AS grnd
    JOIN tb_good_received_note_detail_item AS grndi
      ON grndi.good_received_note_detail_id = grnd.id AND grndi.deleted_at IS NULL
    WHERE grnd.good_received_note_id = grn.id
) AS items ON true
WHERE grn.deleted_at IS NULL;
