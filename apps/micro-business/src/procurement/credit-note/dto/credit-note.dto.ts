import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { EmbeddedCurrencySchema, EmbeddedVendorSchema, EmbeddedWorkflowSchema, InfoSchema } from '@/common/dto/embedded.dto'
import { GoodReceivedNoteSchema } from '@/inventory/good-received-note/dto/good-received-note.dto'
import { enum_credit_note_doc_status, enum_credit_note_type, PrismaClient } from '@repo/prisma-shared-schema-tenant'

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
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '@/common/validate/datetime.validate';

// Re-export validate functions for use with CreditNote
export {
  validateVendorIdExists,
  validateVendorIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
};

export const CreditNoteSchema = z.object({
  id: z.string().uuid().optional( ),
  cn_no: z.string().optional(),
  cn_date: z.string().datetime().optional(),
  doc_status: z.nativeEnum(enum_credit_note_doc_status).optional().default(enum_credit_note_doc_status.draft),
  credit_note_type: z.nativeEnum(enum_credit_note_type),
  description: z.string().optional(),
  cn_reason_id: z.string().uuid().optional(),
})
.merge(InfoSchema)
.merge(EmbeddedWorkflowSchema)
.merge(EmbeddedVendorSchema)
.merge(EmbeddedCurrencySchema)
.merge(z.object({
  grn_id: GoodReceivedNoteSchema.shape.id
}))


export type CreditNote = z.infer<typeof CreditNoteSchema>

export class CreditNoteDto extends createZodDto(CreditNoteSchema) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create CreditNoteSchema with async database validation
 */
export function createCreditNoteValidation(prisma: PrismaClient) {
  return CreditNoteSchema.superRefine(async (data, ctx) => {
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
  });
}