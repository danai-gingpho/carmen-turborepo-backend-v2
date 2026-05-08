import { splitFifoCost } from './fifo-cost-split.helper';

describe('splitFifoCost', () => {
  it('returns a single zero-cost layer when totalCost is 0', () => {
    expect(splitFifoCost(6, 0, 2)).toEqual([
      { qty: 6, costPerUnit: 0, totalCost: 0 },
    ]);
  });

  it('returns empty for qty <= 0', () => {
    expect(splitFifoCost(0, 100, 2)).toEqual([]);
    expect(splitFifoCost(-1, 100, 2)).toEqual([]);
  });

  it('returns empty for negative totalCost', () => {
    expect(splitFifoCost(5, -10, 2)).toEqual([]);
  });

  it('splits cleanly when divisible', () => {
    expect(splitFifoCost(10, 100, 2)).toEqual([
      { qty: 10, costPerUnit: 10, totalCost: 100 },
    ]);
  });

  it('splits into two layers when there is a remainder', () => {
    const result = splitFifoCost(30, 100, 2);
    expect(result).toEqual([
      { qty: 20, costPerUnit: 3.33, totalCost: 66.6 },
      { qty: 10, costPerUnit: 3.34, totalCost: 33.4 },
    ]);
    const sum = result.reduce((s, l) => s + l.totalCost, 0);
    expect(Math.round(sum * 100) / 100).toBe(100);
  });
});
