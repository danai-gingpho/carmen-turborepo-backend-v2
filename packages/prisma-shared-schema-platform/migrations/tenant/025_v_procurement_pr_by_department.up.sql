-- Base query for the "Purchase Request by Department" report.

CREATE OR REPLACE VIEW v_procurement_pr_by_department AS
SELECT
    COALESCE(d.code, '')                        AS location_code,
    COALESCE(d.name, '')                        AS location_name,
    COALESCE(pr.requestor_name, '')             AS created_by,
    pr.pr_no                                    AS pr_no,
    pr.pr_date                                  AS pr_date,
    pr.pr_status                                AS doc_status,
    ''::text                                    AS po_no,
    COALESCE(v.code, '')                        AS vendor_code,
    COALESCE(p.code, '')                        AS product_code,
    COALESCE(p.name, '')                        AS product_desc1,
    COALESCE(prd.description, '')               AS description,
    ''::text                                    AS job_code,
    COALESCE(prd.description, '')               AS name,
    COALESCE(prd.total_price, 0)                AS total_amt,
    pr.department_id                            AS department_id
FROM tb_purchase_request_detail AS prd
JOIN tb_purchase_request        AS pr ON pr.id = prd.purchase_request_id
LEFT JOIN tb_product            AS p  ON p.id  = prd.product_id
LEFT JOIN tb_vendor             AS v  ON v.id  = prd.vendor_id
LEFT JOIN tb_department         AS d  ON d.id  = pr.department_id
WHERE pr.deleted_at IS NULL;
