import {
  calculateAverageCost,
  calculateNewAverageCost,
  buildAvailableFifoLots,
  consumeFifoLots,
  calculateBalance,
  calculateConsumptionTotalCost,
  calculateConsumptionCostPerUnit,
  sumReceivingTotals,
  calculateCreditNoteAmountAdjustment,
  type IReceivingLayer,
  type ILotGroup,
  type IFifoLot,
  type IConsumption,
} from './inventory-cost.formula';

// ─── calculateAverageCost ───────────────────────────────────────────────────

describe('calculateAverageCost', () => {
  it('should return weighted average cost', () => {
    const layers: IReceivingLayer[] = [
      { in_qty: 10, cost_per_unit: 10 },
      { in_qty: 20, cost_per_unit: 15 },
    ];
    // (10*10 + 20*15) / (10+20) = 400/30 = 13.33
    expect(calculateAverageCost(layers)).toBe(13.33);
  });

  it('should return 0 for empty layers', () => {
    expect(calculateAverageCost([])).toBe(0);
  });

  it('should return 0 when total qty is 0', () => {
    const layers: IReceivingLayer[] = [{ in_qty: 0, cost_per_unit: 10 }];
    expect(calculateAverageCost(layers)).toBe(0);
  });

  it('should handle single layer', () => {
    const layers: IReceivingLayer[] = [{ in_qty: 5, cost_per_unit: 8.5 }];
    expect(calculateAverageCost(layers)).toBe(8.5);
  });
});

// ─── calculateNewAverageCost ────────────────────────────────────────────────

describe('calculateNewAverageCost', () => {
  it('should calculate new average after receipt', () => {
    // existing: 10 qty, 100 cost. new: 20 qty, 300 cost
    // new_avg = (100 + 300) / (10 + 20) = 400/30 = 13.33
    expect(calculateNewAverageCost(10, 100, 20, 300)).toBe(13.33);
  });

  it('should return 0 when combined qty is 0', () => {
    expect(calculateNewAverageCost(0, 0, 0, 0)).toBe(0);
  });

  it('should handle first receipt (no existing)', () => {
    // new_avg = 50 / 5 = 10
    expect(calculateNewAverageCost(0, 0, 5, 50)).toBe(10);
  });
});

// ─── buildAvailableFifoLots ─────────────────────────────────────────────────

describe('buildAvailableFifoLots', () => {
  it('should build available lots sorted oldest first', () => {
    const lotGroups = new Map<string, ILotGroup>([
      ['LOT-B', { totalIn: 10, totalCost: 100, lotAtDate: new Date('2026-02-01'), lotSeqNo: 2 }],
      ['LOT-A', { totalIn: 5, totalCost: 50, lotAtDate: new Date('2026-01-01'), lotSeqNo: 1 }],
    ]);
    const consumed = new Map<string, number>([
      ['LOT-A', 2],
    ]);

    const result = buildAvailableFifoLots(lotGroups, consumed);

    expect(result).toHaveLength(2);
    expect(result[0].lotNo).toBe('LOT-A');
    expect(result[0].available).toBe(3);
    expect(result[0].costPerUnit).toBe(10);
    expect(result[1].lotNo).toBe('LOT-B');
    expect(result[1].available).toBe(10);
  });

  it('should exclude fully consumed lots', () => {
    const lotGroups = new Map<string, ILotGroup>([
      ['LOT-A', { totalIn: 5, totalCost: 50, lotAtDate: new Date('2026-01-01'), lotSeqNo: 1 }],
    ]);
    const consumed = new Map<string, number>([['LOT-A', 5]]);

    const result = buildAvailableFifoLots(lotGroups, consumed);
    expect(result).toHaveLength(0);
  });

  it('should sort by lotSeqNo when dates are equal', () => {
    const sameDate = new Date('2026-01-01');
    const lotGroups = new Map<string, ILotGroup>([
      ['LOT-B', { totalIn: 5, totalCost: 50, lotAtDate: sameDate, lotSeqNo: 2 }],
      ['LOT-A', { totalIn: 5, totalCost: 50, lotAtDate: sameDate, lotSeqNo: 1 }],
    ]);

    const result = buildAvailableFifoLots(lotGroups, new Map());
    expect(result[0].lotNo).toBe('LOT-A');
    expect(result[1].lotNo).toBe('LOT-B');
  });
});

// ─── consumeFifoLots ────────────────────────────────────────────────────────

describe('consumeFifoLots', () => {
  const lots: IFifoLot[] = [
    { lotNo: 'LOT-A', available: 5, costPerUnit: 10, lotAtDate: new Date('2026-01-01'), lotSeqNo: 1 },
    { lotNo: 'LOT-B', available: 10, costPerUnit: 15, lotAtDate: new Date('2026-02-01'), lotSeqNo: 2 },
  ];

  it('should consume from single lot when sufficient', () => {
    const result = consumeFifoLots(lots, 3);
    expect(result).toEqual([{ lotNo: 'LOT-A', qty: 3, costPerUnit: 10 }]);
  });

  it('should consume across multiple lots FIFO', () => {
    const result = consumeFifoLots(lots, 8);
    expect(result).toEqual([
      { lotNo: 'LOT-A', qty: 5, costPerUnit: 10 },
      { lotNo: 'LOT-B', qty: 3, costPerUnit: 15 },
    ]);
  });

  it('should consume all available stock exactly', () => {
    const result = consumeFifoLots(lots, 15);
    expect(result).toEqual([
      { lotNo: 'LOT-A', qty: 5, costPerUnit: 10 },
      { lotNo: 'LOT-B', qty: 10, costPerUnit: 15 },
    ]);
  });

  it('should throw when insufficient stock', () => {
    expect(() => consumeFifoLots(lots, 20)).toThrow('Insufficient stock. Requested: 20, Available: 15');
  });
});

// ─── calculateBalance ───────────────────────────────────────────────────────

describe('calculateBalance', () => {
  it('should return in minus out', () => {
    expect(calculateBalance(100, 30)).toBe(70);
  });

  it('should return 0 when equal', () => {
    expect(calculateBalance(50, 50)).toBe(0);
  });

  it('should return negative when over-consumed', () => {
    expect(calculateBalance(10, 15)).toBe(-5);
  });
});

// ─── calculateConsumptionTotalCost ──────────────────────────────────────────

describe('calculateConsumptionTotalCost', () => {
  it('should sum qty × costPerUnit for each consumption', () => {
    const consumptions: IConsumption[] = [
      { lotNo: 'A', qty: 5, costPerUnit: 10 },
      { lotNo: 'B', qty: 3, costPerUnit: 15 },
    ];
    // 5*10 + 3*15 = 50 + 45 = 95
    expect(calculateConsumptionTotalCost(consumptions)).toBe(95);
  });

  it('should return 0 for empty array', () => {
    expect(calculateConsumptionTotalCost([])).toBe(0);
  });

  it('should handle decimal rounding', () => {
    const consumptions: IConsumption[] = [
      { lotNo: 'A', qty: 3, costPerUnit: 3.33 },
    ];
    // 3 * 3.33 = 9.99
    expect(calculateConsumptionTotalCost(consumptions)).toBe(9.99);
  });
});

// ─── calculateConsumptionCostPerUnit ────────────────────────────────────────

describe('calculateConsumptionCostPerUnit', () => {
  it('should return weighted cost per unit', () => {
    const consumptions: IConsumption[] = [
      { lotNo: 'A', qty: 5, costPerUnit: 10 },
      { lotNo: 'B', qty: 3, costPerUnit: 15 },
    ];
    // total_cost = 95, total_qty = 8, cost_per_unit = 95/8 = 11.88
    expect(calculateConsumptionCostPerUnit(consumptions, 8)).toBe(11.88);
  });

  it('should return 0 when totalQty is 0', () => {
    expect(calculateConsumptionCostPerUnit([], 0)).toBe(0);
  });
});

// ─── sumReceivingTotals ─────────────────────────────────────────────────────

describe('sumReceivingTotals', () => {
  it('should aggregate in_qty and in_cost', () => {
    const layers: IReceivingLayer[] = [
      { in_qty: 10, cost_per_unit: 5 },
      { in_qty: 20, cost_per_unit: 8 },
    ];
    const result = sumReceivingTotals(layers);
    expect(result.totalInQty).toBe(30);
    expect(result.totalInCost).toBe(210); // 10*5 + 20*8
  });

  it('should return zeros for empty array', () => {
    const result = sumReceivingTotals([]);
    expect(result.totalInQty).toBe(0);
    expect(result.totalInCost).toBe(0);
  });
});

// ─── calculateCreditNoteAmountAdjustment ────────────────────────────────────

describe('calculateCreditNoteAmountAdjustment', () => {
  describe('Case 1: CN amount <= remaining cost (absorbable)', () => {
    it('should reduce cost by CN amount', () => {
      // 10 units at 10/unit = 100 remaining cost, CN amount = 20
      const result = calculateCreditNoteAmountAdjustment(10, 100, 20);
      expect(result.newTotalCost).toBe(80);
      expect(result.newCostPerUnit).toBe(8); // 80/10
      expect(result.diffAmount).toBe(0);
    });

    it('should handle CN amount equal to remaining cost (reduce to zero cost)', () => {
      const result = calculateCreditNoteAmountAdjustment(10, 100, 100);
      expect(result.newTotalCost).toBe(0);
      expect(result.newCostPerUnit).toBe(0);
      expect(result.diffAmount).toBe(0);
    });

    it('should handle small discount', () => {
      // 5 units at 20/unit = 100 remaining cost, CN amount = 1
      const result = calculateCreditNoteAmountAdjustment(5, 100, 1);
      expect(result.newTotalCost).toBe(99);
      expect(result.newCostPerUnit).toBe(19.8); // 99/5
      expect(result.diffAmount).toBe(0);
    });

    it('should handle decimal rounding correctly', () => {
      // 6 units at 10/unit = 60 remaining cost, CN amount = 20
      // newTotalCost = 40, newCostPerUnit = 40/6 = 6.67 (rounded)
      const result = calculateCreditNoteAmountAdjustment(6, 60, 20);
      expect(result.newTotalCost).toBe(40);
      expect(result.newCostPerUnit).toBe(6.67);
      expect(result.diffAmount).toBe(0);
    });

    it('should handle partial consumption scenario', () => {
      // GRN 10 units at 10/unit, 4 consumed, remaining: 6 at 10/unit = 60
      // CN amount = 20
      const result = calculateCreditNoteAmountAdjustment(6, 60, 20);
      expect(result.newTotalCost).toBe(40);
      expect(result.newCostPerUnit).toBe(6.67); // 40/6 rounded
      expect(result.diffAmount).toBe(0);
    });
  });

  describe('Case 2: CN amount > remaining cost (excess)', () => {
    it('should keep same cost and record diff', () => {
      // 10 units at 10/unit = 100 remaining cost, CN amount = 120
      const result = calculateCreditNoteAmountAdjustment(10, 100, 120);
      expect(result.newTotalCost).toBe(100);
      expect(result.newCostPerUnit).toBe(10); // unchanged
      expect(result.diffAmount).toBe(20); // 120 - 100
    });

    it('should handle CN amount slightly above remaining cost', () => {
      const result = calculateCreditNoteAmountAdjustment(5, 50, 50.01);
      expect(result.newTotalCost).toBe(50);
      expect(result.newCostPerUnit).toBe(10);
      expect(result.diffAmount).toBe(0.01);
    });

    it('should handle very large CN amount', () => {
      const result = calculateCreditNoteAmountAdjustment(10, 100, 1000);
      expect(result.newTotalCost).toBe(100);
      expect(result.newCostPerUnit).toBe(10);
      expect(result.diffAmount).toBe(900);
    });
  });

  describe('Edge cases', () => {
    it('should return full CN as diff when remaining qty is 0', () => {
      const result = calculateCreditNoteAmountAdjustment(0, 0, 50);
      expect(result.newTotalCost).toBe(0);
      expect(result.newCostPerUnit).toBe(0);
      expect(result.diffAmount).toBe(50);
    });

    it('should handle CN amount of 0', () => {
      const result = calculateCreditNoteAmountAdjustment(10, 100, 0);
      expect(result.newTotalCost).toBe(100);
      expect(result.newCostPerUnit).toBe(10);
      expect(result.diffAmount).toBe(0);
    });

    it('should handle decimal remaining cost', () => {
      // 3 units at 3.33/unit = 9.99 remaining cost, CN amount = 5
      const result = calculateCreditNoteAmountAdjustment(3, 9.99, 5);
      expect(result.newTotalCost).toBe(4.99);
      expect(result.newCostPerUnit).toBe(1.66); // 4.99/3 = 1.6633 → 1.66
      expect(result.diffAmount).toBe(0);
    });
  });
});
