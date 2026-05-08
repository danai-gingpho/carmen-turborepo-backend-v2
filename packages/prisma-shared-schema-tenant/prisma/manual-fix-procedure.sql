-- Manual fix script — run via psql against the affected tenant schema when
-- the migration 20260429100100_add_test_report_objects left the procedure
-- uncreated (Prisma marks it applied, but the procedure is missing because
-- older PostgreSQL versions reject DEFAULT on INOUT refcursor params).
--
-- Usage:
--   psql "postgresql://user:pwd@host:port/dbname?sslmode=require" \
--        -v ON_ERROR_STOP=1 \
--        -c 'SET search_path TO "ZEBRA_FIFO"' \
--        -f manual-fix-procedure.sql
--
-- Or in psql interactive:
--   SET search_path TO "ZEBRA_FIFO";
--   \i manual-fix-procedure.sql

-- Drop any partial / broken signature first.
DROP PROCEDURE IF EXISTS sp_test_product_list(text, refcursor);
DROP PROCEDURE IF EXISTS sp_test_product_list(text);
DROP PROCEDURE IF EXISTS sp_test_product_list();

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

-- Verify
SELECT n.nspname || '.' || p.proname AS proc,
       pg_get_function_identity_arguments(p.oid) AS args
FROM   pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE  p.proname = 'sp_test_product_list';
