-- Denormalize aggregated amount totals onto tb_good_received_note so list/sort
-- queries can use Prisma orderBy directly instead of computing in memory.

ALTER TABLE "tb_good_received_note"
  ADD COLUMN "net_amount"        DECIMAL(15, 5) NOT NULL DEFAULT 0,
  ADD COLUMN "base_net_amount"   DECIMAL(15, 5) NOT NULL DEFAULT 0,
  ADD COLUMN "total_amount"      DECIMAL(15, 5) NOT NULL DEFAULT 0,
  ADD COLUMN "base_total_amount" DECIMAL(15, 5) NOT NULL DEFAULT 0;

-- Backfill existing rows from detail items
WITH grn_totals AS (
  SELECT
    d.good_received_note_id        AS grn_id,
    COALESCE(SUM(i.net_amount),       0) AS net_amount,
    COALESCE(SUM(i.base_net_amount),  0) AS base_net_amount,
    COALESCE(SUM(i.total_price),      0) AS total_amount,
    COALESCE(SUM(i.base_total_price), 0) AS base_total_amount
  FROM "tb_good_received_note_detail_item" i
  JOIN "tb_good_received_note_detail"      d ON d."id" = i."good_received_note_detail_id"
  WHERE i."deleted_at" IS NULL
  GROUP BY d.good_received_note_id
)
UPDATE "tb_good_received_note" g
SET
  "net_amount"        = t.net_amount,
  "base_net_amount"   = t.base_net_amount,
  "total_amount"      = t.total_amount,
  "base_total_amount" = t.base_total_amount
FROM grn_totals t
WHERE g."id" = t.grn_id;
