-- Base query for the "Stock In Detail" report.

CREATE OR REPLACE VIEW v_inventory_stock_in_detail AS
SELECT
    si.si_no                                                AS ref_no,
    si.si_date                                              AS doc_date,
    si.si_date                                              AS commit_date,
    COALESCE(si.adjustment_type_code, '')                   AS doc_type,
    COALESCE(si.description, '')                            AS description,
    COALESCE(si.location_name, '')                          AS location_name,
    COALESCE(sid.product_code, p.code, '')                  AS product_code,
    COALESCE(sid.product_name, p.name, '')                  AS product_desc1,
    COALESCE(p.inventory_unit_name, '')                     AS unit,
    COALESCE(sid.qty, 0)                                    AS qty,
    COALESCE(sid.cost_per_unit, 0)                          AS cost_per_unit,
    COALESCE(sid.total_cost, 0)                             AS amount,
    COALESCE(si.location_code, '')                          AS location_code
FROM tb_stock_in AS si
JOIN tb_stock_in_detail AS sid ON sid.stock_in_id = si.id AND sid.deleted_at IS NULL
LEFT JOIN tb_product    AS p   ON p.id = sid.product_id   AND p.deleted_at IS NULL
WHERE si.deleted_at IS NULL;
