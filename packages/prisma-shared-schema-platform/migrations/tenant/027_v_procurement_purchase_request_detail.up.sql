-- Base query for the "Purchase Request Detail" report.

CREATE OR REPLACE VIEW v_procurement_purchase_request_detail AS
SELECT
    COALESCE(prd.location_name, '')             AS location_name,
    COALESCE(prd.location_code, '')             AS location_code,
    pr.pr_no                                    AS pr_no,
    pr.pr_date                                  AS pr_date,
    COALESCE(pr.description, '')                AS description,
    COALESCE(prd.product_code, '')              AS product_code,
    COALESCE(prd.product_name, '')              AS product_desc1,
    COALESCE(prd.requested_qty, 0)              AS request_qty,
    COALESCE(prd.approved_unit_name, '')        AS approve_unit,
    COALESCE(prd.base_price, 0)                 AS price,
    COALESCE(prd.net_amount, 0)                 AS net_amt,
    COALESCE(prd.tax_amount, 0)                 AS tax_amt,
    COALESCE(prd.total_price, 0)                AS total_amt,
    COALESCE(pr.pr_status::text, '')            AS doc_status,
    COALESCE(prd.vendor_name, '')               AS vendor_name
FROM tb_purchase_request AS pr
JOIN tb_purchase_request_detail AS prd ON prd.purchase_request_id = pr.id AND prd.deleted_at IS NULL
WHERE pr.deleted_at IS NULL;
