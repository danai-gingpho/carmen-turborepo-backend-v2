import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { EmbeddedVendorSchema, InfoSchema, EmbeddedProductSchema } from '../embedded.dto';

// Import validate functions
import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '../../validate/currency.validate';

import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '../../validate/vendor.validate';

import {
  validateProductIdExists,
  validateProductIdsExist,
} from '../../validate/product.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '../../validate/unit.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '../../validate/tax-profile.validate';

import {
  validatePriceListIdExists,
  validatePriceListIdsExist,
} from '../../validate/price-list.validate';

import {
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '../../validate/datetime.validate';

export const PriceListSchema = z.object({
  id: z.string().uuid(),
  pricelist_no: z.string().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  currency_id: z.string().uuid().optional(),
  effective_from_date: z.coerce.date(),
  effective_to_date: z.coerce.date(),
  is_active: z.boolean().optional().default(true),
  doc_version: z.number().optional().default(0),
})
.merge(EmbeddedVendorSchema)
.merge(InfoSchema)

export const PriceListDetailSchema = z.object({
  id: z.string().uuid(),
  pricelist_id: z.string().uuid(),
  sequence_no: z.number().optional(),
  doc_version: z.number().optional().default(0),
  unit_id: z.string().uuid().optional(),
  tax_profile_id: z.string().uuid().optional(),
  tax_rate: z.number().optional(),
  moq_qty: z.number().optional(),
})
.merge(EmbeddedProductSchema)
.merge(InfoSchema)

export const PriceListDetailItemSchema = z.object({
  sequence_no: z.number().optional(),
  product_id: z.string().uuid(),
  unit_id: z.string().uuid().optional(),
  tax_profile_id: z.string().uuid().optional(),
  tax_rate: z.number().optional(),
  moq_qty: z.number().optional(),
})

export const PriceListDetailActionSchema = z.object({
  add: z.array(PriceListDetailItemSchema).optional(),
  update: z.array(PriceListDetailItemSchema.extend({ id: z.string().uuid() })).optional(),
  delete: z.array(z.string().uuid()).optional(),
})

export const PriceListCreate = PriceListSchema.omit({
  id: true,
  doc_version: true,
  pricelist_no: true,
}).extend({
  pricelist_detail: PriceListDetailActionSchema.optional(),
})

export type IPriceListCreate = z.infer<typeof PriceListCreate>;

export class PriceListCreateDto extends createZodDto(PriceListCreate) {}

export const PricelistUpdate = PriceListSchema.partial().extend({
  pricelist_detail: PriceListDetailActionSchema.optional(),
})

export type IPriceListUpdate = z.infer<typeof PricelistUpdate> & {
  id: string;
};

export class PriceListUpdateDto extends createZodDto(
  PricelistUpdate,
) {}

// ============================================================================
// CSV Import Schemas
// ============================================================================

/**
 * Schema for a single row in the CSV import file
 * Supports both header-level and detail-level data
 */
export const PriceListCsvRowSchema = z.object({
  // Header fields (for identifying/creating price list)
  pricelist_no: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive']).optional(),
  vendor_id: z.string().uuid().optional(),
  currency_id: z.string().uuid().optional(),
  effective_from_date: z.string().optional(),
  effective_to_date: z.string().optional(),
  note: z.string().optional(),

  // Detail fields
  product_id: z.string().uuid().optional(),
  unit_id: z.string().uuid().optional(),
  tax_profile_id: z.string().uuid().optional(),
  moq_qty: z.coerce.number().optional(),
  price_without_tax: z.coerce.number().optional(),
  tax_rate: z.coerce.number().optional(),
  tax_amt: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  lead_time_days: z.coerce.number().int().optional(),
  is_active: z.coerce.boolean().optional(),
  detail_note: z.string().optional(),
});

export type IPriceListCsvRow = z.infer<typeof PriceListCsvRowSchema>;

/**
 * Schema for import error reporting
 */
export const PriceListImportErrorSchema = z.object({
  row: z.number(),
  field: z.string().optional(),
  message: z.string(),
  data: z.record(z.any()).optional(),
});

export type IPriceListImportError = z.infer<typeof PriceListImportErrorSchema>;

/**
 * Schema for import result response
 */
export const PriceListImportResultSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    total_rows: z.number(),
    created: z.number(),
    updated: z.number(),
    skipped: z.number(),
    errors: z.number(),
  }),
  created_ids: z.array(z.string().uuid()),
  updated_ids: z.array(z.string().uuid()),
  errors: z.array(PriceListImportErrorSchema),
});

export type IPriceListImportResult = z.infer<typeof PriceListImportResultSchema>;
