import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/prisma-shared-schema-tenant';
import { BackendLogger } from '@/common/helpers/backend.logger';

interface ProductAtLocation {
  product_id: string;
  product_name: string;
  product_code: string;
  product_sku: string;
  inventory_unit_id: string;
  on_hand_qty: Prisma.Decimal;
}

@Injectable()
export class SpotCheckLogic {
  private readonly logger = new BackendLogger(SpotCheckLogic.name);

  async getProductsByLocation(
    prisma: any,
    location_id: string,
  ): Promise<ProductAtLocation[]> {
    const products = await prisma.$queryRaw<ProductAtLocation[]>`
      SELECT
        itd.product_id,
        p.name as product_name,
        p.code as product_code,
        p.sku as product_sku,
        p.inventory_unit_id,
        COALESCE(SUM(itd.qty), 0) as on_hand_qty
      FROM tb_inventory_transaction_detail itd
      JOIN tb_product p ON itd.product_id = p.id
      WHERE itd.location_id = ${location_id}::uuid
        AND p.deleted_at IS NULL
      GROUP BY itd.product_id, p.name, p.code, p.sku, p.inventory_unit_id
      HAVING COALESCE(SUM(itd.qty), 0) != 0
    `;
    return products;
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

  buildDetailCreateData(
    products: ProductAtLocation[],
    spotCheckId: string,
    userId: string,
  ): any[] {
    return products.map((p, index) => ({
      spot_check_id: spotCheckId,
      sequence_no: index + 1,
      product_id: p.product_id,
      product_name: p.product_name,
      product_code: p.product_code,
      product_sku: p.product_sku,
      on_hand_qty: p.on_hand_qty,
      count_qty: 0,
      diff_qty: 0,
      inventory_unit_id: p.inventory_unit_id,
      created_by_id: userId,
    }));
  }
}
