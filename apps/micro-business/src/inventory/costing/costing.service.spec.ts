import { Test } from '@nestjs/testing';
import { Prisma } from '@repo/prisma-shared-schema-tenant';
import { CostingService } from './costing.service';
import { costMapKey } from './costing.types';

describe('CostingService', () => {
  let service: CostingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CostingService],
    }).compile();
    service = module.get(CostingService);
  });

  describe('standard', () => {
    it('returns tb_product.standard_cost (location-agnostic)', async () => {
      const prisma: any = {
        tb_product: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'p1', standard_cost: new Prisma.Decimal(15.5) },
            { id: 'p2', standard_cost: new Prisma.Decimal(0) },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'standard',
        items: [
          { product_id: 'p1', location_id: 'loc-a' },
          { product_id: 'p2', location_id: 'loc-b' },
          { product_id: 'p1', location_id: 'loc-c' }, // same product different location
        ],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))?.toString()).toBe('15.5');
      expect(result.get(costMapKey('p1', 'loc-c'))?.toString()).toBe('15.5');
      expect(result.get(costMapKey('p2', 'loc-b'))?.toString()).toBe('0');
      expect(prisma.tb_product.findMany).toHaveBeenCalledTimes(1); // dedup
    });

    it('omits entries when product not found (caller will fallback to 0)', async () => {
      const prisma: any = {
        tb_product: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'standard',
        items: [{ product_id: 'p-missing', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p-missing', 'loc-a'))).toBeUndefined();
    });
  });

  describe('last_receiving', () => {
    it('returns latest GRN cost per (product, location), derived as net_amount/received_base_qty', async () => {
      // Two GRN details, second is newer. Mock returns rows ordered DESC.
      const prisma: any = {
        tb_good_received_note_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              location_id: 'loc-a',
              created_at: new Date('2026-04-29T10:00:00Z'),
              tb_good_received_note_detail_item: [
                {
                  net_amount: new Prisma.Decimal(200),
                  received_base_qty: new Prisma.Decimal(10),
                },
              ],
            },
            {
              product_id: 'p1',
              location_id: 'loc-a',
              created_at: new Date('2026-04-28T10:00:00Z'),
              tb_good_received_note_detail_item: [
                {
                  net_amount: new Prisma.Decimal(150),
                  received_base_qty: new Prisma.Decimal(10),
                },
              ],
            },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last_receiving',
        items: [{ product_id: 'p1', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))?.toString()).toBe('20');
    });

    it('returns no entry when GRN has zero received_base_qty (caller falls back to 0)', async () => {
      const prisma: any = {
        tb_good_received_note_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              location_id: 'loc-a',
              created_at: new Date(),
              tb_good_received_note_detail_item: [
                { net_amount: new Prisma.Decimal(100), received_base_qty: new Prisma.Decimal(0) },
              ],
            },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last_receiving',
        items: [{ product_id: 'p1', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))).toBeUndefined();
    });

    it('omits entry when no GRN exists', async () => {
      const prisma: any = {
        tb_good_received_note_detail: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last_receiving',
        items: [{ product_id: 'p-new', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p-new', 'loc-a'))).toBeUndefined();
    });
  });

  describe('last', () => {
    it('returns GRN cost when GRN is newer than stock_in', async () => {
      const grnDate = new Date('2026-04-29T10:00:00Z');
      const stockInDate = new Date('2026-04-28T10:00:00Z');

      const prisma: any = {
        tb_good_received_note_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              location_id: 'loc-a',
              tb_good_received_note: { grn_date: grnDate },
              tb_good_received_note_detail_item: [
                { net_amount: new Prisma.Decimal(200), received_base_qty: new Prisma.Decimal(10) },
              ],
            },
          ]),
        },
        tb_stock_in_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              cost_per_unit: new Prisma.Decimal(15),
              created_at: stockInDate,
              tb_stock_in: { location_id: 'loc-a' },
            },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last',
        items: [{ product_id: 'p1', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))?.toString()).toBe('20');
    });

    it('returns stock_in cost when stock_in is newer than GRN', async () => {
      const grnDate = new Date('2026-04-28T10:00:00Z');
      const stockInDate = new Date('2026-04-29T10:00:00Z');

      const prisma: any = {
        tb_good_received_note_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              location_id: 'loc-a',
              tb_good_received_note: { grn_date: grnDate },
              tb_good_received_note_detail_item: [
                { net_amount: new Prisma.Decimal(200), received_base_qty: new Prisma.Decimal(10) },
              ],
            },
          ]),
        },
        tb_stock_in_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              cost_per_unit: new Prisma.Decimal(15),
              created_at: stockInDate,
              tb_stock_in: { location_id: 'loc-a' },
            },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last',
        items: [{ product_id: 'p1', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))?.toString()).toBe('15');
    });

    it('returns stock_in cost when no GRN exists', async () => {
      const prisma: any = {
        tb_good_received_note_detail: {
          findMany: jest.fn().mockResolvedValue([]),
        },
        tb_stock_in_detail: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              cost_per_unit: new Prisma.Decimal(7.5),
              created_at: new Date(),
              tb_stock_in: { location_id: 'loc-a' },
            },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last',
        items: [{ product_id: 'p1', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))?.toString()).toBe('7.5');
    });

    it('omits entry when neither table has match', async () => {
      const prisma: any = {
        tb_good_received_note_detail: { findMany: jest.fn().mockResolvedValue([]) },
        tb_stock_in_detail: { findMany: jest.fn().mockResolvedValue([]) },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'last',
        items: [{ product_id: 'p-new', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p-new', 'loc-a'))).toBeUndefined();
    });
  });

  describe('average', () => {
    it('returns average_cost_per_unit from latest cost layer per (product, location)', async () => {
      const prisma: any = {
        tb_inventory_transaction_cost_layer: {
          findMany: jest.fn().mockResolvedValue([
            {
              product_id: 'p1',
              location_id: 'loc-a',
              average_cost_per_unit: new Prisma.Decimal(12.5),
              lot_at_date: new Date('2026-04-29T00:00:00Z'),
            },
            {
              product_id: 'p1',
              location_id: 'loc-a',
              average_cost_per_unit: new Prisma.Decimal(10),
              lot_at_date: new Date('2026-04-25T00:00:00Z'),
            },
          ]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'average',
        items: [{ product_id: 'p1', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p1', 'loc-a'))?.toString()).toBe('12.5');
    });

    it('omits entry when no cost layer exists', async () => {
      const prisma: any = {
        tb_inventory_transaction_cost_layer: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const result = await service.getCostsPerUnit({
        prisma,
        method: 'average',
        items: [{ product_id: 'p-new', location_id: 'loc-a' }],
      });

      expect(result.get(costMapKey('p-new', 'loc-a'))).toBeUndefined();
    });
  });
});
