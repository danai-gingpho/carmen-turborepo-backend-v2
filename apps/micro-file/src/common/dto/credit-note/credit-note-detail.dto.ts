import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { EmbeddedLocationSchema, EmbeddedTaxSchema, InfoSchema, PriceSchema, ValidateSchema } from '../embedded.dto';

// Import validate functions
import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '../../validate/location.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '../../validate/tax-profile.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '../../validate/unit.validate';

// Re-export validate functions for use with CreditNoteDetail
export {
  validateLocationIdExists,
  validateLocationIdsExist,
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
  validateUnitIdExists,
  validateUnitIdsExist,
};

export const CreditNoteDetailSchema = z
  .object({
    id: z.string().uuid(),
    inventory_transaction_id: z.string().uuid().optional(),
    credit_note_id: z.string().uuid(),
    amount: z.number().optional(),
  })
  .merge(
    z.object({
      requested_qty: ValidateSchema.shape.quantity,
      approved_qty: ValidateSchema.shape.quantity,
    }),
  )
  .merge(InfoSchema)
  .merge(EmbeddedLocationSchema)
  .merge(EmbeddedTaxSchema)
  .merge(z.object({
    return_base_qty: ValidateSchema.shape.quantity.optional(),
    return_unit_id: z.string().uuid().optional(),
    return_unit_conversion_factor: ValidateSchema.shape.price.optional(),
  }))
  .merge(PriceSchema)

export type CreditNoteDetail = z.infer<typeof CreditNoteDetailSchema>;

export class CreditNoteDetailDto extends createZodDto(CreditNoteDetailSchema) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create CreditNoteDetailSchema with async database validation
 */
export function createCreditNoteDetailValidation(prisma: PrismaClient) {
  return CreditNoteDetailSchema.superRefine(async (data, ctx) => {
    // Validate location_id
    if (data.location_id) {
      const location = await validateLocationIdExists(prisma, data.location_id);
      if (!location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location not found',
          path: ['location_id'],
        });
      }
    }

    // Validate tax_profile_id
    if (data.tax_profile_id) {
      const taxProfile = await validateTaxProfileIdExists(prisma, data.tax_profile_id);
      if (!taxProfile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tax profile not found',
          path: ['tax_profile_id'],
        });
      }
    }

    // Validate return_unit_id
    if (data.return_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.return_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Return unit not found',
          path: ['return_unit_id'],
        });
      }
    }
  });
}
