-- Base query for the "Credit Note Detail" financial report.
-- Exposes display columns plus raw *_code columns for caller-side filters.

CREATE OR REPLACE VIEW v_financial_credit_note_detail AS
SELECT
    cn.cn_no                                            AS cn_no,
    cn.cn_date                                          AS cn_date,
    COALESCE(cn.credit_note_type::text, '')             AS cn_type,
    COALESCE(v.code, '')                                AS vendor_code,
    COALESCE(v.name, '')                                AS vendor_name,
    COALESCE(cn.description, '')                        AS description,
    COALESCE(cn.doc_status::text, '')                   AS doc_status,
    cn.cn_date                                          AS doc_date,
    COALESCE(cn.invoice_no, '')                         AS ref_no,
    COALESCE(cn.currency_code, '')                      AS currency_code,
    COALESCE(cn.exchange_rate, 1)                       AS ex_rate_audit,
    COALESCE(grn.grn_no, '')                            AS rec_no,
    COALESCE(l.code, '')                                AS location_code,
    COALESCE(l.name, '')                                AS location_name,
    COALESCE(p.code, '')                                AS product_code,
    COALESCE(p.name, '')                                AS product_desc1,
    COALESCE(cnd.return_qty, 0)                         AS rec_qty,
    COALESCE(cnd.return_unit_name, '')                  AS unit_code,
    COALESCE(cnd.price, 0)                              AS price,
    COALESCE(cnd.net_amount, 0)                         AS net_amt,
    COALESCE(cnd.tax_amount, 0)                         AS tax_amt,
    COALESCE(cnd.total_price, 0)                        AS total_amt,
    cn.vendor_id                                        AS vendor_id,
    cn.id                                               AS credit_note_id,
    cnd.location_id                                     AS cnd_location_id
FROM tb_credit_note_detail AS cnd
JOIN tb_credit_note         AS cn  ON cn.id = cnd.credit_note_id
LEFT JOIN tb_vendor         AS v   ON v.id  = cn.vendor_id
LEFT JOIN tb_good_received_note AS grn ON grn.id = cn.grn_id
LEFT JOIN tb_location       AS l   ON l.id  = cnd.location_id
LEFT JOIN tb_product        AS p   ON p.id  = cnd.product_id
WHERE cn.deleted_at IS NULL;
