-- Denormalize aggregated base-amount totals onto tb_purchase_request so list/sort
-- queries can use Prisma orderBy directly. PR rows can mix currencies across
-- details, so only base_* totals are stored on the header (per-currency totals
-- would be meaningless when summed across rows).

ALTER TABLE "tb_purchase_request"
  ADD COLUMN "base_net_amount"   DECIMAL(15, 5) NOT NULL DEFAULT 0,
  ADD COLUMN "base_total_amount" DECIMAL(15, 5) NOT NULL DEFAULT 0;

-- Backfill existing rows from non-deleted detail rows
WITH pr_totals AS (
  SELECT
    d.purchase_request_id              AS pr_id,
    COALESCE(SUM(d.base_net_amount),  0) AS base_net_amount,
    COALESCE(SUM(d.base_total_price), 0) AS base_total_amount
  FROM "tb_purchase_request_detail" d
  WHERE d."deleted_at" IS NULL
    AND d.purchase_request_id IS NOT NULL
  GROUP BY d.purchase_request_id
)
UPDATE "tb_purchase_request" p
SET
  "base_net_amount"   = t.base_net_amount,
  "base_total_amount" = t.base_total_amount
FROM pr_totals t
WHERE p."id" = t.pr_id;
