import { z } from 'zod';

/**
 * Zod field that handles Date objects from Prisma and converts them to ISO strings.
 * Use this for created_at, updated_at, and similar timestamp fields.
 */
export const dateField = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString() : val),
  z.string().nullable().optional()
);

/**
 * Required date field (non-nullable)
 */
export const dateFieldRequired = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString() : val),
  z.string()
);

/**
 * DateTime field with datetime validation (nullable)
 * Use this for fields that require ISO datetime format validation
 */
export const datetimeField = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString() : val),
  z.string().datetime().nullable()
);

/**
 * DateTime field (nullable, optional)
 */
export const datetimeFieldOptional = z.preprocess(
  (val) => (val instanceof Date ? val.toISOString() : val),
  z.string().datetime().nullable().optional()
);

/**
 * Helper to convert Prisma Decimal objects to numbers.
 * Prisma returns Decimal fields as Decimal.js objects, not plain numbers.
 */
const toNumber = (val: unknown): number | null | undefined => {
  if (val === null) return null;
  if (val === undefined) return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return Number(val);
  // Handle Prisma Decimal objects (they have toNumber() method)
  if (typeof val === 'object' && val !== null && 'toNumber' in val && typeof (val as any).toNumber === 'function') {
    return (val as any).toNumber();
  }
  // Fallback: try to convert to number
  return Number(val);
};

/**
 * Decimal field that handles Prisma Decimal objects (nullable, optional)
 * Use this for price, rate, amount, and similar decimal fields.
 */
export const decimalField = z.preprocess(toNumber, z.number().nullable().optional());

/**
 * Required decimal field (non-nullable)
 */
export const decimalFieldRequired = z.preprocess(toNumber, z.number());

/**
 * Decimal field (nullable only, not optional)
 */
export const decimalFieldNullable = z.preprocess(toNumber, z.number().nullable());
