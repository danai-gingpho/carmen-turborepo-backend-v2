-- Base query for the "Vendor Detail" report.

CREATE OR REPLACE VIEW v_vendor_vendor_detail AS
SELECT
    v.code                                                          AS vendor_code,
    COALESCE(v.name, '')                                            AS vendor_name,
    COALESCE(v.description, '')                                     AS vendor_category,
    ''::text                                                        AS tax_id,
    ''::text                                                        AS tax_branch_id,
    COALESCE(va.address_line1, '')                                  AS address,
    COALESCE(vc.phone, '')                                          AS telephone,
    ''::text                                                        AS fax,
    COALESCE(v.tax_profile_name, '')                                AS tax_type,
    COALESCE(v.tax_rate, 0)                                         AS tax_rate,
    ''::text                                                        AS credit_term,
    ''::text                                                        AS discount,
    CASE WHEN v.is_active THEN 'Active' ELSE 'Inactive' END         AS status,
    v.is_active                                                     AS is_active
FROM tb_vendor AS v
LEFT JOIN tb_vendor_address AS va ON va.vendor_id = v.id AND va.is_active = true AND va.deleted_at IS NULL
LEFT JOIN tb_vendor_contact AS vc ON vc.vendor_id = v.id AND vc.is_primary = true AND vc.is_active = true AND vc.deleted_at IS NULL
WHERE v.deleted_at IS NULL;
