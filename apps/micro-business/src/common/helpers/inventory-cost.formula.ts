/**
 * Inventory Costing Formulas
 *
 * Pure calculation functions for FIFO and Average costing methods.
 * These are separated from the service layer so business logic is testable
 * and the formulas are easy to audit.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single cost layer from the database (receiving only, in_qty > 0) */
export interface IReceivingLayer {
  in_qty: number;
  cost_per_unit: number;
}

/** A FIFO lot with its available balance after consumption */
export interface IFifoLot {
  lotNo: string;
  available: number;
  costPerUnit: number;
  lotAtDate: Date;
  lotSeqNo: number;
}

/** Result of consuming from a FIFO lot */
export interface IConsumption {
  lotNo: string;
  qty: number;
  costPerUnit: number;
}

/** Raw lot data grouped from cost layers */
export interface ILotGroup {
  totalIn: number;
  totalCost: number;
  lotAtDate: Date;
  lotSeqNo: number;
}

// ─── Average Costing Formulas ────────────────────────────────────────────────

/**
 * Calculate weighted average cost per unit from receiving layers.
 *
 * Formula:
 *   avg_cost = (in_qty1 × cost1 + in_qty2 × cost2 + ... + in_qtyN × costN) / (in_qty1 + in_qty2 + ... + in_qtyN)
 *
 * Where N = all receiving records (good_received_note, adjustment_in, transfer_in).
 * Outgoing records (issue, adjustment_out, transfer_out) are NOT included.
 *
 * @param layers - All receiving cost layers (where in_qty > 0)
 * @returns Weighted average cost per unit, rounded to 2 decimals
 */
export function calculateAverageCost(layers: IReceivingLayer[]): number {
  let totalInQty = 0;
  let totalInCost = 0;

  for (const layer of layers) {
    totalInQty += layer.in_qty;
    totalInCost += layer.in_qty * layer.cost_per_unit;
  }

  if (totalInQty <= 0) return 0;
  return Math.round((totalInCost / totalInQty) * 100) / 100;
}

/**
 * Calculate new weighted average cost after a new receipt.
 *
 * Formula:
 *   new_avg = (existing_total_receiving_cost + new_qty × new_cost_per_unit) / (existing_total_receiving_qty + new_qty)
 *
 * This is equivalent to calling calculateAverageCost with the new layer appended,
 * but avoids re-fetching all layers when we already have the totals.
 *
 * @param existingInQty   - Sum of in_qty from all existing receiving layers
 * @param existingInCost  - Sum of (in_qty × cost_per_unit) from all existing receiving layers
 * @param newQty          - Quantity being received
 * @param newTotalCost    - Total cost of new receipt (qty × cost_per_unit)
 * @returns New weighted average cost per unit, rounded to 2 decimals
 */
export function calculateNewAverageCost(
  existingInQty: number,
  existingInCost: number,
  newQty: number,
  newTotalCost: number,
): number {
  const combinedQty = existingInQty + newQty;
  const combinedCost = existingInCost + newTotalCost;

  if (combinedQty <= 0) return 0;
  return Math.round((combinedCost / combinedQty) * 100) / 100;
}

// ─── FIFO Costing Formulas ───────────────────────────────────────────────────

/**
 * Build available FIFO lots from grouped lot data and consumed amounts.
 *
 * For each lot:
 *   available = totalIn - consumed
 *   costPerUnit = totalCost / totalIn
 *
 * Lots are sorted oldest first (by lot_at_date, then lot_seq_no) for FIFO consumption.
 *
 * @param lotGroups    - Map of lot_no → aggregated in data
 * @param consumedPerLot - Map of lot_no → total consumed out_qty
 * @returns Available lots sorted by date ASC (oldest first)
 */
export function buildAvailableFifoLots(
  lotGroups: Map<string, ILotGroup>,
  consumedPerLot: Map<string, number>,
): IFifoLot[] {
  const available: IFifoLot[] = [];

  for (const [lotNo, info] of lotGroups) {
    const consumed = consumedPerLot.get(lotNo) || 0;
    const balance = info.totalIn - consumed;
    if (balance > 0) {
      available.push({
        lotNo,
        available: balance,
        costPerUnit: Math.round((info.totalCost / info.totalIn) * 100) / 100,
        lotAtDate: info.lotAtDate,
        lotSeqNo: info.lotSeqNo,
      });
    }
  }

  // Sort oldest first for FIFO: by date, then sequence number
  available.sort((a, b) => {
    const timeDiff = a.lotAtDate.getTime() - b.lotAtDate.getTime();
    return timeDiff !== 0 ? timeDiff : a.lotSeqNo - b.lotSeqNo;
  });

  return available;
}

/**
 * Consume stock from FIFO lots (oldest first).
 *
 * Iterates through available lots in order and consumes the requested quantity.
 * Each consumption records which lot it came from and at what cost.
 *
 * @param lots - Available lots sorted oldest first
 * @param qty  - Quantity to consume
 * @returns Array of consumptions. Throws if insufficient stock.
 */
export function consumeFifoLots(lots: IFifoLot[], qty: number): IConsumption[] {
  let remaining = qty;
  const consumptions: IConsumption[] = [];

  for (const lot of lots) {
    if (remaining <= 0) break;
    const consume = Math.min(lot.available, remaining);
    consumptions.push({ lotNo: lot.lotNo, qty: consume, costPerUnit: lot.costPerUnit });
    remaining -= consume;
  }

  if (remaining > 0) {
    const totalAvailable = lots.reduce((sum, l) => sum + l.available, 0);
    throw new Error(`Insufficient stock. Requested: ${qty}, Available: ${totalAvailable}`);
  }

  return consumptions;
}

// ─── Shared Formulas ─────────────────────────────────────────────────────────

/**
 * Calculate stock balance for a set of cost layers.
 *
 * Formula:
 *   balance = sum(in_qty) - sum(out_qty)
 *
 * @param totalInQty  - Sum of all in_qty
 * @param totalOutQty - Sum of all out_qty
 * @returns Net balance
 */
export function calculateBalance(totalInQty: number, totalOutQty: number): number {
  return totalInQty - totalOutQty;
}

/**
 * Calculate total cost from consumptions.
 *
 * Formula:
 *   total = sum(qty × costPerUnit) for each consumption, rounded to 2 decimals
 *
 * @param consumptions - Array of FIFO consumptions
 * @returns Total cost rounded to 2 decimals
 */
export function calculateConsumptionTotalCost(consumptions: IConsumption[]): number {
  return consumptions.reduce(
    (sum, c) => Math.round((sum + c.qty * c.costPerUnit) * 100) / 100,
    0,
  );
}

/**
 * Calculate weighted cost per unit from consumptions.
 *
 * Formula:
 *   cost_per_unit = total_cost / total_qty
 *
 * @param consumptions - Array of FIFO consumptions
 * @param totalQty     - Total quantity consumed
 * @returns Weighted cost per unit rounded to 2 decimals
 */
export function calculateConsumptionCostPerUnit(consumptions: IConsumption[], totalQty: number): number {
  const totalCost = calculateConsumptionTotalCost(consumptions);
  if (totalQty <= 0) return 0;
  return Math.round((totalCost / totalQty) * 100) / 100;
}

// ─── Credit Note Qty (Average) Formula ──────────────────────────────────────

/**
 * Calculate new weighted average cost after a credit note qty adjustment.
 *
 * Formula:
 *   new_avg = (totalInCost - cnTotalCost) / (totalInQty - cnQty)
 *
 * Where:
 *   totalInCost = sum of (in_qty × cost_per_unit) from all receiving layers
 *   totalInQty  = sum of in_qty from all receiving layers
 *   cnTotalCost = cnQty × cnCostPerUnit
 *
 * @param totalInQty    - Sum of in_qty from all receiving layers (increase events)
 * @param totalInCost   - Sum of (in_qty × cost_per_unit) from all receiving layers
 * @param cnQty         - Credit note quantity being returned
 * @param cnCostPerUnit - Credit note cost per unit
 * @returns New weighted average cost per unit, rounded to 2 decimals
 */
export function calculateAverageCostAfterCreditNoteQty(
  totalInQty: number,
  totalInCost: number,
  cnQty: number,
  cnCostPerUnit: number,
): number {
  const newQty = totalInQty - cnQty;
  const newCost = totalInCost - (cnQty * cnCostPerUnit);

  if (newQty <= 0) return 0;
  return Math.round((newCost / newQty) * 100) / 100;
}

// ─── Credit Note Amount Formulas ────────────────────────────────────────────

/** Result of a credit note amount adjustment calculation */
export interface ICreditNoteAmountResult {
  /** New total cost after adjustment */
  newTotalCost: number;
  /** New cost per unit after adjustment */
  newCostPerUnit: number;
  /** Excess amount that could not be absorbed (Case 2 only) */
  diffAmount: number;
}

/**
 * Calculate the adjusted cost after applying a credit note amount (discount).
 *
 * Case 1 — CN amount <= remaining cost:
 *   newTotalCost = remaining_cost − cn_amount
 *   newCostPerUnit = newTotalCost / remaining_qty
 *   diffAmount = 0
 *
 * Case 2 — CN amount > remaining cost:
 *   newTotalCost = remaining_cost (unchanged, can't go below zero)
 *   newCostPerUnit = original cost per unit (unchanged)
 *   diffAmount = cn_amount − remaining_cost (excess recorded)
 *
 * @param remainingQty  - Available qty in the lot after prior consumption
 * @param remainingCost - Available cost in the lot (remainingQty × costPerUnit)
 * @param cnAmount      - Credit note amount (monetary discount to apply)
 * @returns { newTotalCost, newCostPerUnit, diffAmount }
 */
export function calculateCreditNoteAmountAdjustment(
  remainingQty: number,
  remainingCost: number,
  cnAmount: number,
): ICreditNoteAmountResult {
  if (remainingQty <= 0) {
    return { newTotalCost: 0, newCostPerUnit: 0, diffAmount: cnAmount };
  }

  if (cnAmount <= remainingCost) {
    // Case 1: fully absorbable — reduce cost
    const newTotalCost = Math.round((remainingCost - cnAmount) * 100) / 100;
    const newCostPerUnit = Math.round((newTotalCost / remainingQty) * 100) / 100;
    return { newTotalCost, newCostPerUnit, diffAmount: 0 };
  }

  // Case 2: exceeds remaining cost — keep same cost, record excess
  const newCostPerUnit = Math.round((remainingCost / remainingQty) * 100) / 100;
  const diffAmount = Math.round((cnAmount - remainingCost) * 100) / 100;
  return { newTotalCost: remainingCost, newCostPerUnit, diffAmount };
}

/**
 * Sum receiving totals from raw cost layers.
 *
 * Utility to aggregate in_qty and in_qty × cost_per_unit from a list of
 * receiving layers. Used before calling calculateNewAverageCost.
 *
 * @param layers - Receiving layers from DB (in_qty > 0)
 * @returns { totalInQty, totalInCost }
 */
export function sumReceivingTotals(layers: IReceivingLayer[]): { totalInQty: number; totalInCost: number } {
  let totalInQty = 0;
  let totalInCost = 0;
  for (const layer of layers) {
    totalInQty += layer.in_qty;
    totalInCost += layer.in_qty * layer.cost_per_unit;
  }
  return { totalInQty, totalInCost };
}
