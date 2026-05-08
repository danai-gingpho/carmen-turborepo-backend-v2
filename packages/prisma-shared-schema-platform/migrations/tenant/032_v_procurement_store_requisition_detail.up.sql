-- Base query for the "Store Requisition Detail" report.

CREATE OR REPLACE VIEW v_procurement_store_requisition_detail AS
SELECT
    sr.sr_no                                        AS sr_no,
    sr.sr_date                                      AS sr_date,
    ''::text                                        AS movement_type,
    COALESCE(sr.from_location_name, '')             AS request_from,
    COALESCE(sr.from_location_code, '')             AS request_from_code,
    COALESCE(sr.description, '')                    AS description,
    COALESCE(sr.to_location_name, '')               AS location_name,
    COALESCE(sr.to_location_code, '')               AS location_code,
    COALESCE(srd.product_code, p.code, '')          AS product_code,
    COALESCE(srd.product_name, p.name, '')          AS product_desc1,
    COALESCE(p.inventory_unit_name, '')             AS unit,
    COALESCE(srd.requested_qty, 0)                  AS qty_req,
    COALESCE(srd.issued_qty, 0)                     AS qty_issue,
    cl.avg_cost                                     AS cost_per_unit,
    COALESCE(srd.issued_qty, 0) * cl.avg_cost       AS issue_amount,
    sr.doc_status                                   AS doc_status
FROM tb_store_requisition AS sr
JOIN tb_store_requisition_detail AS srd ON srd.store_requisition_id = sr.id AND srd.deleted_at IS NULL
LEFT JOIN tb_product AS p ON p.id = srd.product_id AND p.deleted_at IS NULL
LEFT JOIN LATERAL (
    SELECT COALESCE(AVG(average_cost_per_unit), 0) AS avg_cost
    FROM tb_inventory_transaction_cost_layer
    WHERE product_id = srd.product_id AND deleted_at IS NULL
) AS cl ON true
WHERE sr.deleted_at IS NULL;
