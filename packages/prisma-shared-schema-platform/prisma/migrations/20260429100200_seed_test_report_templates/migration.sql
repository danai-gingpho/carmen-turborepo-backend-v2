-- Seed three test report templates exercising each source_type.
-- Names are namespaced "TEST_…" so they're easy to find / drop later.
-- The dialog XML defines a single optional "ProductFrom" lookup so the
-- function / procedure variants get a non-trivial parameter to bind to.
-- ProductFrom is an existing field on the Go model.ReportFilters struct.

INSERT INTO "tb_report_template"
  (id, name, description, report_group, dialog, content, builder_key,
   view_name, source_type, source_name, source_params, is_standard, is_active)
VALUES
  (gen_random_uuid(),
   'TEST_Product_List_View',
   'Test template — source_type=view, no parameters',
   'Test',
   '<Dialog><Lookup Name="ProductFrom" Value="" /></Dialog>',
   '',
   'test-product-list-view',
   'v_test_product_list',
   'view',
   'v_test_product_list',
   '{"params":[]}'::jsonb,
   true,
   true),

  (gen_random_uuid(),
   'TEST_Product_List_Function',
   'Test template — source_type=function, 1 nullable text param (ProductFrom = product code)',
   'Test',
   '<Dialog><Lookup Name="ProductFrom" Value="" /></Dialog>',
   '',
   'test-product-list-function',
   NULL,
   'function',
   'fn_test_product_list',
   '{"params":[{"filter":"ProductFrom","type":"text","nullable":true}]}'::jsonb,
   true,
   true),

  (gen_random_uuid(),
   'TEST_Product_List_Procedure',
   'Test template — source_type=procedure, 1 nullable text param + refcursor',
   'Test',
   '<Dialog><Lookup Name="ProductFrom" Value="" /></Dialog>',
   '',
   'test-product-list-procedure',
   NULL,
   'procedure',
   'sp_test_product_list',
   '{"params":[{"filter":"ProductFrom","type":"text","nullable":true}]}'::jsonb,
   true,
   true)
ON CONFLICT (name, deleted_at) DO NOTHING;
