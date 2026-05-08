-- Test report data sources used by the new source_type flow in micro-report.
--
-- All DDL is idempotent (DROP IF EXISTS first, then CREATE) so the migration
-- can be re-applied safely after a partial / failed run.

-- ── Drop any prior versions to clear partial state ─────────────────────────
DROP VIEW       IF EXISTS v_test_product_list;
DROP FUNCTION   IF EXISTS fn_test_product_list(text);
DROP FUNCTION   IF EXISTS fn_test_product_list();
DROP PROCEDURE  IF EXISTS sp_test_product_list(text, refcursor);
DROP PROCEDURE  IF EXISTS sp_test_product_list(text);
DROP PROCEDURE  IF EXISTS sp_test_product_list();

-- ── 1) View ────────────────────────────────────────────────────────────────
CREATE VIEW v_test_product_list AS
SELECT p.id,
       p.code,
       p.name,
       p.local_name,
       p.description,
       p.inventory_unit_name,
       p.product_status_type::text AS product_status_type,
       p.is_active,
       p.created_at
FROM   tb_product p
WHERE  p.deleted_at IS NULL;

-- ── 2) Function (RETURNS TABLE) ────────────────────────────────────────────
CREATE FUNCTION fn_test_product_list(p_code TEXT DEFAULT NULL)
RETURNS TABLE (
  id                  uuid,
  code                varchar,
  name                varchar,
  local_name          varchar,
  description         varchar,
  inventory_unit_name varchar,
  product_status_type text,
  is_active           boolean,
  created_at          timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT p.id,
         p.code,
         p.name,
         p.local_name,
         p.description,
         p.inventory_unit_name,
         p.product_status_type::text,
         p.is_active,
         p.created_at
  FROM   tb_product p
  WHERE  p.deleted_at IS NULL
    AND  (p_code IS NULL OR p.code = p_code);
$$;

-- ── 3) Procedure (refcursor convention) ────────────────────────────────────
-- INOUT refcursor must NOT have a DEFAULT — older PG versions reject it.
-- The Go executor always passes the cursor name explicitly.
CREATE PROCEDURE sp_test_product_list(
  p_code TEXT,
  INOUT _rs refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
  OPEN _rs FOR
    SELECT p.id,
           p.code,
           p.name,
           p.local_name,
           p.description,
           p.inventory_unit_name,
           p.product_status_type::text AS product_status_type,
           p.is_active,
           p.created_at
    FROM   tb_product p
    WHERE  p.deleted_at IS NULL
      AND  (p_code IS NULL OR p.code = p_code);
END;
$$;
