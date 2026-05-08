import { calculateAverageCost, IReceivingLayer } from './inventory-cost.formula';

/**
 * Minimal Prisma surface needed to read receiving cost layers for a product.
 * Accepts either a tenant Prisma client or an in-flight `$transaction` proxy.
 */
export interface ICostLayerReader {
  tb_inventory_transaction_cost_layer: {
    findMany: (args: {
      where: { product_id: string; in_qty: { gt: number }; deleted_at: null };
      select: { in_qty: true; cost_per_unit: true };
    }) => Promise<{ in_qty: unknown; cost_per_unit: unknown }[]>;
  };
}

/**
 * Compute the current weighted-average cost per unit for a product by reading
 * its receiving cost layers and applying the same formula the inventory
 * transaction service uses for average costing.
 *
 * Mirrors `InventoryTransactionService.getCurrentAverageCost` (which is private
 * and tx-scoped) so callers outside the inventory-transaction module can reuse
 * the same calculation without reaching into that service.
 */
export async function getCurrentAverageCost(
  prisma: ICostLayerReader,
  productId: string,
): Promise<number> {
  const rawLayers = await prisma.tb_inventory_transaction_cost_layer.findMany({
    where: { product_id: productId, in_qty: { gt: 0 }, deleted_at: null },
    select: { in_qty: true, cost_per_unit: true },
  });

  const layers: IReceivingLayer[] = rawLayers.map((l) => ({
    in_qty: Number(l.in_qty),
    cost_per_unit: Number(l.cost_per_unit),
  }));

  return calculateAverageCost(layers);
}
