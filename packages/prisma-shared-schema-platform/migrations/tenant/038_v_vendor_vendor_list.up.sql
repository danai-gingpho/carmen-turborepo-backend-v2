-- Base query for the "Vendor List" report.

CREATE OR REPLACE VIEW v_vendor_vendor_list AS
SELECT
    v.code                                                          AS vendor_code,
    COALESCE(v.name, '')                                            AS vendor_name,
    COALESCE(v.tax_profile_name, '')                                AS tax_id,
    ''::text                                                        AS credit_term,
    ''::text                                                        AS discount,
    CASE WHEN v.is_active THEN 'Active' ELSE 'Inactive' END         AS doc_status,
    v.is_active                                                     AS is_active
FROM tb_vendor AS v
WHERE v.deleted_at IS NULL;
