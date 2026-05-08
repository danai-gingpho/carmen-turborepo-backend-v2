import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/prisma-shared-schema-tenant';
import {
  GetCostInput,
  GetCostsBatchInput,
  TenantPrisma,
  costMapKey,
} from './costing.types';

@Injectable()
export class CostingService {
  /**
   * Returns the cost-per-unit (Decimal) for a single (product, location) using the given method.
   * Returns Decimal(0) when no source data is found (fallback policy per spec).
   */
  async getCostPerUnit(input: GetCostInput): Promise<Prisma.Decimal> {
    const map = await this.getCostsPerUnit({
      prisma: input.prisma,
      method: input.method,
      items: [{ product_id: input.product_id, location_id: input.location_id }],
    });
    return map.get(costMapKey(input.product_id, input.location_id)) ?? new Prisma.Decimal(0);
  }

  /**
   * Batch lookup. Returns Map keyed by `${product_id}:${location_id}`.
   * Missing entries imply Decimal(0) — callers should use `?? new Prisma.Decimal(0)`.
   */
  async getCostsPerUnit(input: GetCostsBatchInput): Promise<Map<string, Prisma.Decimal>> {
    if (input.items.length === 0) {
      return new Map();
    }

    switch (input.method) {
      case 'standard':
        return this.lookupStandard(input.prisma, input.items);
      case 'last_receiving':
        return this.lookupLastReceiving(input.prisma, input.items);
      case 'last':
        return this.lookupLast(input.prisma, input.items);
      case 'average':
        return this.lookupAverage(input.prisma, input.items);
    }
  }

  private async lookupStandard(
    prisma: TenantPrisma,
    items: GetCostsBatchInput['items'],
  ): Promise<Map<string, Prisma.Decimal>> {
    const productIds = Array.from(new Set(items.map((i) => i.product_id)));
    const products = await prisma.tb_product.findMany({
      where: { id: { in: productIds }, deleted_at: null },
      select: { id: true, standard_cost: true },
    });

    const productCost = new Map<string, Prisma.Decimal>();
    for (const p of products) {
      productCost.set(p.id, p.standard_cost ?? new Prisma.Decimal(0));
    }

    const result = new Map<string, Prisma.Decimal>();
    for (const item of items) {
      const cost = productCost.get(item.product_id);
      if (cost !== undefined) {
        result.set(costMapKey(item.product_id, item.location_id), cost);
      }
    }
    return result;
  }

  private async lookupLastReceiving(
    prisma: TenantPrisma,
    items: GetCostsBatchInput['items'],
  ): Promise<Map<string, Prisma.Decimal>> {
    const result = new Map<string, Prisma.Decimal>();
    if (items.length === 0) return result;

    const productIds = Array.from(new Set(items.map((i) => i.product_id)));
    const locationIds = Array.from(new Set(items.map((i) => i.location_id)));
    const wantedKeys = new Set(items.map((i) => costMapKey(i.product_id, i.location_id)));

    // Fetch GRN details for all (product, location) pairs of interest, newest first.
    // We over-fetch then filter in-memory by exact pair to avoid N queries.
    // Soft-delete + ordering live on the parent tb_good_received_note (the
    // detail row itself has neither column).
    const rows = await prisma.tb_good_received_note_detail.findMany({
      where: {
        product_id: { in: productIds },
        location_id: { in: locationIds },
        tb_good_received_note: { deleted_at: null },
      },
      orderBy: { tb_good_received_note: { grn_date: 'desc' } },
      select: {
        product_id: true,
        location_id: true,
        tb_good_received_note_detail_item: {
          where: { deleted_at: null },
          select: {
            net_amount: true,
            received_base_qty: true,
          },
        },
      },
    });

    for (const row of rows) {
      const key = costMapKey(row.product_id, row.location_id);
      if (!wantedKeys.has(key)) continue;
      if (result.has(key)) continue; // already took the newest

      // Sum across items on the same detail row (rare but safe), then derive cost-per-unit
      let totalNet = new Prisma.Decimal(0);
      let totalQty = new Prisma.Decimal(0);
      for (const item of row.tb_good_received_note_detail_item) {
        totalNet = totalNet.plus(item.net_amount ?? 0);
        totalQty = totalQty.plus(item.received_base_qty ?? 0);
      }

      if (totalQty.isZero()) continue; // skip — caller falls back to 0
      result.set(key, totalNet.dividedBy(totalQty));
    }

    return result;
  }

  private async lookupLast(
    prisma: TenantPrisma,
    items: GetCostsBatchInput['items'],
  ): Promise<Map<string, Prisma.Decimal>> {
    const result = new Map<string, Prisma.Decimal>();
    if (items.length === 0) return result;

    const productIds = Array.from(new Set(items.map((i) => i.product_id)));
    const locationIds = Array.from(new Set(items.map((i) => i.location_id)));
    const wantedKeys = new Set(items.map((i) => costMapKey(i.product_id, i.location_id)));

    // Run both queries in parallel
    const [grnRows, stockInRows] = await Promise.all([
      prisma.tb_good_received_note_detail.findMany({
        where: {
          product_id: { in: productIds },
          location_id: { in: locationIds },
          tb_good_received_note: { deleted_at: null },
        },
        orderBy: { tb_good_received_note: { grn_date: 'desc' } },
        select: {
          product_id: true,
          location_id: true,
          tb_good_received_note: { select: { grn_date: true } },
          tb_good_received_note_detail_item: {
            where: { deleted_at: null },
            select: { net_amount: true, received_base_qty: true },
          },
        },
      }),
      prisma.tb_stock_in_detail.findMany({
        where: {
          product_id: { in: productIds },
          deleted_at: null,
          tb_stock_in: { location_id: { in: locationIds }, deleted_at: null },
        },
        orderBy: { created_at: 'desc' },
        select: {
          product_id: true,
          cost_per_unit: true,
          created_at: true,
          tb_stock_in: { select: { location_id: true } },
        },
      }),
    ]);

    // Build "newest-per-key" candidates from each source (with derived cost where needed)
    type Candidate = { cost: Prisma.Decimal; at: Date };
    const newest = new Map<string, Candidate>();

    for (const row of grnRows) {
      const key = costMapKey(row.product_id, row.location_id);
      if (!wantedKeys.has(key)) continue;
      if (newest.has(key)) continue; // GRN rows already DESC, take first

      let totalNet = new Prisma.Decimal(0);
      let totalQty = new Prisma.Decimal(0);
      for (const item of row.tb_good_received_note_detail_item) {
        totalNet = totalNet.plus(item.net_amount ?? 0);
        totalQty = totalQty.plus(item.received_base_qty ?? 0);
      }
      if (totalQty.isZero()) continue;
      newest.set(key, {
        cost: totalNet.dividedBy(totalQty),
        at: row.tb_good_received_note?.grn_date ?? new Date(0),
      });
    }

    for (const row of stockInRows) {
      const loc = row.tb_stock_in?.location_id;
      if (!loc) continue;
      const key = costMapKey(row.product_id, loc);
      if (!wantedKeys.has(key)) continue;

      const candidate: Candidate = {
        cost: row.cost_per_unit ?? new Prisma.Decimal(0),
        at: row.created_at ?? new Date(0),
      };
      const existing = newest.get(key);
      if (!existing || candidate.at > existing.at) {
        newest.set(key, candidate);
      }
    }

    for (const [key, c] of newest) {
      result.set(key, c.cost);
    }

    return result;
  }

  private async lookupAverage(
    prisma: TenantPrisma,
    items: GetCostsBatchInput['items'],
  ): Promise<Map<string, Prisma.Decimal>> {
    const result = new Map<string, Prisma.Decimal>();
    if (items.length === 0) return result;

    const productIds = Array.from(new Set(items.map((i) => i.product_id)));
    const locationIds = Array.from(new Set(items.map((i) => i.location_id)));
    const wantedKeys = new Set(items.map((i) => costMapKey(i.product_id, i.location_id)));

    const rows = await prisma.tb_inventory_transaction_cost_layer.findMany({
      where: {
        product_id: { in: productIds },
        location_id: { in: locationIds },
        deleted_at: null,
      },
      orderBy: { lot_at_date: 'desc' },
      select: {
        product_id: true,
        location_id: true,
        average_cost_per_unit: true,
      },
    });

    for (const row of rows) {
      if (!row.product_id || !row.location_id) continue;
      const key = costMapKey(row.product_id, row.location_id);
      if (!wantedKeys.has(key)) continue;
      if (result.has(key)) continue; // newest already taken

      const cost = row.average_cost_per_unit ?? new Prisma.Decimal(0);
      if (cost.isZero()) continue;
      result.set(key, cost);
    }

    return result;
  }
}
