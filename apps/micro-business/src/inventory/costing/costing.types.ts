import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

export type CostingMethod = 'standard' | 'last' | 'average' | 'last_receiving';

export const COSTING_METHODS: readonly CostingMethod[] = [
  'standard',
  'last',
  'average',
  'last_receiving',
] as const;

export function isCostingMethod(value: unknown): value is CostingMethod {
  return typeof value === 'string' && (COSTING_METHODS as readonly string[]).includes(value);
}

export type TenantPrisma = NonNullable<Awaited<ReturnType<typeof PrismaClient_TENANT>>>;

export interface GetCostInput {
  prisma: TenantPrisma;
  product_id: string;
  location_id: string;
  method: CostingMethod;
}

export interface CostLookupItem {
  product_id: string;
  location_id: string;
}

export interface GetCostsBatchInput {
  prisma: TenantPrisma;
  items: CostLookupItem[];
  method: CostingMethod;
}

export function costMapKey(product_id: string, location_id: string): string {
  return `${product_id}:${location_id}`;
}
