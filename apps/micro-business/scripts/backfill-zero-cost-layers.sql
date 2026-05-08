-- Backfill missing cost_layer rows for zero-cost stock-in receipts.
--
-- Context: before the fifo-cost-split guard fix, splitFifoCost returned []
-- when totalCost <= 0, so zero-cost stock-in details never got a matching
-- tb_inventory_transaction_cost_layer row. Those details are invisible to
-- on_hand (computed from layers) and to FIFO deduction.
--
-- This script finds inbound details (qty > 0) under receiving transactions
-- that have no sibling cost_layer row and inserts one layer per orphan.
-- Run once per affected tenant schema. Idempotent: re-running is a no-op.

INSERT INTO tb_inventory_transaction_cost_layer (
  id, inventory_transaction_detail_id, lot_no, lot_index, location_id,
  location_code, lot_at_date, lot_seq_no, product_id, at_period,
  transaction_type, in_qty, out_qty, cost_per_unit, total_cost,
  diff_amount, average_cost_per_unit, created_by_id, created_at
)
SELECT
  gen_random_uuid(),
  d.id,
  d.current_lot_no,
  1,
  d.location_id,
  d.location_code,
  d.created_at,
  0,
  d.product_id,
  to_char(d.created_at, 'YYMM'),
  'adjustment_in'::enum_transaction_type,
  d.qty,
  0,
  d.cost_per_unit,
  d.total_cost,
  0,
  0,
  d.created_by_id,
  d.created_at
FROM tb_inventory_transaction_detail d
JOIN tb_inventory_transaction t
  ON t.id = d.inventory_transaction_id AND t.deleted_at IS NULL
WHERE d.qty > 0
  AND t.inventory_doc_type IN ('good_received_note', 'stock_in')
  AND NOT EXISTS (
    SELECT 1 FROM tb_inventory_transaction_cost_layer l
    WHERE l.inventory_transaction_detail_id = d.id
      AND l.deleted_at IS NULL
  );
