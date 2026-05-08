import { Injectable } from '@nestjs/common';
import {
  Prisma,
  PrismaClient,
  enum_period_status,
} from '@repo/prisma-shared-schema-tenant';
import { BackendLogger } from '@/common/helpers/backend.logger';

interface ProductAtLocation {
  product_id: string;
  product_code: string;
  product_name: string;
  product_local_name: string | null;
  product_sku: string | null;
  inventory_unit_id: string;
  on_hand_qty: Prisma.Decimal;
}

@Injectable()
export class SpotCheckLogic {
  private readonly logger = new BackendLogger(SpotCheckLogic.name);

  async getProductsByLocation(
    prisma: PrismaClient,
    location_id: string,
  ): Promise<ProductAtLocation[]> {
    // Group inventory transactions by product to get on_hand_qty
    const stockGrouped = await prisma.tb_inventory_transaction_detail.groupBy({
      by: ['product_id'],
      where: { location_id },
      _sum: { qty: true },
    });

    // Filter products with non-zero stock
    const nonZeroStock = stockGrouped.filter(
      (g) => g._sum.qty && !g._sum.qty.equals(0),
    );

    if (nonZeroStock.length === 0) return [];

    const productIds = nonZeroStock.map((g) => g.product_id);

    // Get product details
    const productRecords = await prisma.tb_product.findMany({
      where: { id: { in: productIds }, deleted_at: null },
      select: { id: true, name: true, local_name: true, code: true, sku: true, inventory_unit_id: true },
    });

    // Build on_hand_qty map
    const qtyMap = new Map(
      nonZeroStock.map((g) => [g.product_id, g._sum.qty as Prisma.Decimal]),
    );

    // Combine product details with on_hand_qty
    return productRecords.map((p) => ({
      product_id: p.id,
      product_code: p.code,
      product_name: p.name,
      product_local_name: p.local_name,
      product_sku: p.code,
      inventory_unit_id: p.inventory_unit_id,
      on_hand_qty: qtyMap.get(p.id) || new Prisma.Decimal(0),
    }));
  }

  selectRandom(
    products: ProductAtLocation[],
    count: number,
  ): ProductAtLocation[] {
    const shuffled = [...products];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  selectManual(
    products: ProductAtLocation[],
    selectedProductIds: string[],
  ): ProductAtLocation[] {
    const idSet = new Set(selectedProductIds);
    return products.filter((p) => idSet.has(p.product_id));
  }

  async getActivePeriod(prisma: PrismaClient) {
    return prisma.tb_period.findFirst({
      where: {
        status: { in: [enum_period_status.open, enum_period_status.locked] },
        deleted_at: null,
      },
      orderBy: [{ fiscal_year: 'asc' }, { fiscal_month: 'asc' }],
      select: { id: true, start_at: true, end_at: true },
    });
  }

  async selectHighValue(
    prisma: PrismaClient,
    products: ProductAtLocation[],
    count: number,
    location_id: string,
    periodStartAt: Date,
    periodEndAt: Date,
  ): Promise<ProductAtLocation[]> {
    if (products.length === 0) return [];

    const productIds = products.map((p) => p.product_id);

    const maxCosts = await prisma.tb_inventory_transaction_cost_layer.groupBy({
      by: ['product_id'],
      where: {
        product_id: { in: productIds },
        location_id,
        in_qty: { gt: 0 },
        lot_at_date: { gte: periodStartAt, lte: periodEndAt },
        deleted_at: null,
      },
      _max: { cost_per_unit: true },
    });

    const costMap = new Map<string, Prisma.Decimal>(
      maxCosts
        .filter((row) => row.product_id && row._max.cost_per_unit != null)
        .map((row) => [
          row.product_id as string,
          row._max.cost_per_unit as Prisma.Decimal,
        ]),
    );

    const ranked = products
      .map((product) => {
        const cost = costMap.get(product.product_id) ?? new Prisma.Decimal(0);
        const value = product.on_hand_qty.mul(cost);
        return { product, value };
      })
      .sort((a, b) => b.value.comparedTo(a.value));

    return ranked.slice(0, count).map((entry) => entry.product);
  }

  buildDetailCreateData(
    products: ProductAtLocation[],
    spotCheckId: string,
    userId: string,
     
  ): any[] {
    return products.map((p, index) => ({
      spot_check_id: spotCheckId,
      sequence_no: index + 1,
      product_id: p.product_id,
      product_code: p.product_code,
      product_name: p.product_name,
      product_local_name: p.product_local_name,
      product_sku: p.product_sku,
      on_hand_qty: p.on_hand_qty,
      actual_qty: 0,
      diff_qty: 0,
      inventory_unit_id: p.inventory_unit_id,
      created_by_id: userId,
    }));
  }
}
