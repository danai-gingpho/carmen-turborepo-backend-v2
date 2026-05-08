-- Drop transfer module tables (DESTRUCTIVE — data is permanently lost).
-- Per design decisions Q1+Q5 in docs/superpowers/specs/2026-04-29-remove-transfer-module-design.md.
-- Enum values transfer_header / transfer_detail (enum_dimension_display_in) and
-- transfer_in / transfer_out (enum_transaction_type) are intentionally retained
-- to preserve historical inventory transaction rows.
-- DROP order is child→parent matching the FK graph; CASCADE removes FK
-- constraints only — parent rows in tb_inventory_transaction, tb_product,
-- tb_location are untouched.
DROP TABLE IF EXISTS "tb_transfer_detail_comment" CASCADE;
DROP TABLE IF EXISTS "tb_transfer_comment" CASCADE;
DROP TABLE IF EXISTS "tb_transfer_detail" CASCADE;
DROP TABLE IF EXISTS "tb_transfer" CASCADE;
