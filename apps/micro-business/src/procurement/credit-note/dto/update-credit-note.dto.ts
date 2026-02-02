import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { PrismaClient } from '@repo/prisma-shared-schema-tenant'
import { CreditNoteSchema } from './credit-note.dto'
import { CreditNoteDetailSchema } from './credit-note-detail.dto'

// Import validate functions
import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '@/common/validate/vendor.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '@/common/validate/currency.validate';

import {
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
} from '@/common/validate/workflow.validate';

import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '@/common/validate/location.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '@/common/validate/tax-profile.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '@/common/validate/unit.validate';

// Re-export validate functions for use with UpdateCreditNote
export {
  validateVendorIdExists,
  validateVendorIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
  validateLocationIdExists,
  validateLocationIdsExist,
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
  validateUnitIdExists,
  validateUnitIdsExist,
};

export const UpdateCreditNoteSchema = CreditNoteSchema
.extend({
  credit_note_detail: z.object({
    add: z.array(CreditNoteDetailSchema.omit({
      id: true,
      credit_note_id: true,
    })).optional(),
    update: z.array(CreditNoteDetailSchema).optional(),
    delete: z.array(z.object({ id: z.string().uuid() })).optional(),
  }).optional()
})

export class UpdateCreditNoteDto extends createZodDto(UpdateCreditNoteSchema) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Helper function to validate credit note detail items
 */
async function validateCreditNoteDetailItems(
  prisma: PrismaClient,
  items: Array<{ location_id?: string; tax_profile_id?: string; return_unit_id?: string }> | undefined,
  ctx: z.RefinementCtx,
  basePath: string[],
) {
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Validate location_id
    if (item.location_id) {
      const location = await validateLocationIdExists(prisma, item.location_id);
      if (!location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location not found',
          path: [...basePath, i.toString(), 'location_id'],
        });
      }
    }

    // Validate tax_profile_id
    if (item.tax_profile_id) {
      const taxProfile = await validateTaxProfileIdExists(prisma, item.tax_profile_id);
      if (!taxProfile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tax profile not found',
          path: [...basePath, i.toString(), 'tax_profile_id'],
        });
      }
    }

    // Validate return_unit_id
    if (item.return_unit_id) {
      const unit = await validateUnitIdExists(prisma, item.return_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Return unit not found',
          path: [...basePath, i.toString(), 'return_unit_id'],
        });
      }
    }
  }
}

/**
 * Create UpdateCreditNoteSchema with async database validation
 */
export function createCreditNoteUpdateValidation(prisma: PrismaClient) {
  return UpdateCreditNoteSchema.superRefine(async (data, ctx) => {
    // Validate vendor_id
    if (data.vendor_id) {
      const vendor = await validateVendorIdExists(prisma, data.vendor_id);
      if (!vendor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vendor not found',
          path: ['vendor_id'],
        });
      }
    }

    // Validate currency_id
    if (data.currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency not found',
          path: ['currency_id'],
        });
      }
    }

    // Validate workflow_id
    // if (data.workflow_id) {
    //   const workflow = await validateWorkflowIdExists(prisma, data.workflow_id);
    //   if (!workflow) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: 'Workflow not found',
    //       path: ['workflow_id'],
    //     });
    //   }
    // }

    // Validate credit_note_detail.add
    await validateCreditNoteDetailItems(
      prisma,
      data.credit_note_detail?.add,
      ctx,
      ['credit_note_detail', 'add'],
    );

    // Validate credit_note_detail.update
    await validateCreditNoteDetailItems(
      prisma,
      data.credit_note_detail?.update,
      ctx,
      ['credit_note_detail', 'update'],
    );
  });
}