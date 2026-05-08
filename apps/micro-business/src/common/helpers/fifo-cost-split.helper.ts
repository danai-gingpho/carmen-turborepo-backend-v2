export interface FifoCostLayer {
  qty: number;
  costPerUnit: number;
  totalCost: number;
}

/**
 * Split total cost across quantity using FIFO method with exact decimal reconciliation.
 *
 * The problem: dividing total cost by quantity often produces a remainder that
 * doesn't multiply back exactly. For example, 100 / 30 = 3.333... rounded to
 * 3.33, but 3.33 * 30 = 99.90 (missing 0.10).
 *
 * The solution: split into two groups — a larger group at the floor price and
 * a smaller group at floor + 1 cent, so the sum always equals the original total.
 *
 * Example: splitFifoCost(30, 100, 2)
 *   → [{ qty: 20, costPerUnit: 3.33, totalCost: 66.60 },
 *      { qty: 10, costPerUnit: 3.34, totalCost: 33.40 }]
 *   → 66.60 + 33.40 = 100.00 ✓
 *
 * @param qty - Total quantity of items (must be positive integer)
 * @param totalCost - Total cost to distribute (must be non-negative)
 * @param decimals - Number of decimal places for cost_per_unit (default: 2)
 * @returns Array of 0–2 cost layers that sum back to totalCost exactly
 */
export function splitFifoCost(
  qty: number,
  totalCost: number,
  decimals: number = 2,
): FifoCostLayer[] {
  if (qty <= 0 || totalCost < 0) {
    return [];
  }

  const multiplier = Math.pow(10, decimals);

  // Floor the cost per unit to N decimal places
  const baseCostInt = Math.floor((totalCost / qty) * multiplier);
  const baseCost = baseCostInt / multiplier;

  // Calculate how much total cost the base price accounts for (using integer math to avoid floating point)
  const baseTotalInt = baseCostInt * qty;
  const remainderInt = Math.round(totalCost * multiplier) - baseTotalInt;

  // remainderInt = number of items that need +1 smallest unit (e.g., +0.01)
  const higherQty = remainderInt;
  const lowerQty = qty - higherQty;

  const higherCost = (baseCostInt + 1) / multiplier;

  const layers: FifoCostLayer[] = [];

  if (lowerQty > 0) {
    const lowerTotal = Math.round(lowerQty * baseCostInt) / multiplier;
    layers.push({
      qty: lowerQty,
      costPerUnit: baseCost,
      totalCost: lowerTotal,
    });
  }

  if (higherQty > 0) {
    const higherTotal = Math.round(higherQty * (baseCostInt + 1)) / multiplier;
    layers.push({
      qty: higherQty,
      costPerUnit: higherCost,
      totalCost: higherTotal,
    });
  }

  return layers;
}
