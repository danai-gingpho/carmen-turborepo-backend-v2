import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_allocate_extra_cost_type, enum_doc_status, enum_good_received_note_type, enum_tax_type, PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { EmbeddedCurrencySchema, EmbeddedDiscountSchema, EmbeddedLocationSchema, EmbeddedProductSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, EmbeddedWorkflowSchema, FocSchema, InfoSchema, ReceivedQuantityAndUnitSchema } from '../embedded.dto';

// Import validate functions
import {
  validateCreditTermIdExists,
  validateCreditTermIdsExist,
} from '../../validate/credit-term.validate';

import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '../../validate/vendor.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '../../validate/currency.validate';

import {
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
} from '../../validate/workflow.validate';

import {
  validateProductIdExists,
  validateProductIdsExist,
} from '../../validate/product.validate';

import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '../../validate/location.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '../../validate/tax-profile.validate';

import {
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '../../validate/datetime.validate';

// Re-export validate functions for use with GoodReceivedNote
export {
  validateCreditTermIdExists,
  validateCreditTermIdsExist,
  validateVendorIdExists,
  validateVendorIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
  validateProductIdExists,
  validateProductIdsExist,
  validateLocationIdExists,
  validateLocationIdsExist,
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
};

export const GoodReceivedNoteSchema = z.object({
  id: z.string().uuid(),
  grn_no: z.string(),
  invoice_no: z.string().optional(),
  invoice_date: z.string().datetime().pipe(z.coerce.date()).optional(),
  description: z.string().optional(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional(),
  doc_type: z.enum(Object.values(enum_good_received_note_type) as [string, ...string[]]),
  is_consignment: z.boolean().optional(),
  is_cash: z.boolean().optional(),
  signature_image_url: z.string().optional(),

  received_by_id: z.string().uuid().optional(),
  received_by_name: z.string().optional(),
  received_at: z.string().datetime().pipe(z.coerce.date()).optional(),

  credit_term_id: z.string().uuid().optional(),
  credit_term_name: z.string().optional(),
  credit_term_days: z.number().int().optional(),
  payment_due_date: z.string().datetime().pipe(z.coerce.date()).optional(),
  is_active: z.boolean().optional().default(true),
  grn_date: z.string().datetime().pipe(z.coerce.date()).optional(),
  expired_date: z.string().datetime().pipe(z.coerce.date()).optional(),
})
.merge(EmbeddedVendorSchema)
.merge(EmbeddedCurrencySchema)
.merge(EmbeddedWorkflowSchema)
.merge(EmbeddedDiscountSchema)
.merge(InfoSchema)

const GoodReceivedNoteDetailSchema = z.object({
  id: z.string().uuid(),
  inventory_transaction_id: z.string().uuid(),
  good_received_note_id: z.string().uuid(),
  purchase_order_detail_id: z.string().uuid(),
  sequence_no: z.number().optional(),
})
.merge(EmbeddedProductSchema)
.merge(EmbeddedLocationSchema)
// .merge(EmbeddedUnitAndQuantitySchema)
.merge(EmbeddedTaxSchema)
// .merge(EmbeddedDeliverySchema)


export const GoodReceivedNoteDetail_PO_Create = GoodReceivedNoteDetailSchema.omit({
  id: true,
  inventory_transaction_id: true,
  good_received_note_id: true,
  sequence_no: true,
}).extend({
  purchase_order_detail_id: z.string().uuid().optional(),
})

export const GoodReceivedNoteDetail_Manual_Create = GoodReceivedNoteDetailSchema.omit({
  id: true,
  inventory_transaction_id: true,
  good_received_note_id: true,
  purchase_order_detail_id: true,
  sequence_no: true,
})
.merge(ReceivedQuantityAndUnitSchema)
.merge(FocSchema);

export const ExtraCostDetailCreate = z.object({
  extra_cost_type_id: z.string().uuid(),
  amount: z.number().optional(),
})
.merge(EmbeddedTaxSchema.extend({
  tax_type: z
    .enum(Object.values(enum_tax_type) as [string, ...string[]])
    .optional(),
}))
.merge(InfoSchema)

export const GoodReceivedNoteCreate = GoodReceivedNoteSchema
.omit({
  id: true,
  grn_no: true,
})
.extend({
  good_received_note_detail: z
    .object({
      add: z.array(GoodReceivedNoteDetail_PO_Create || GoodReceivedNoteDetail_Manual_Create).optional(),
    })
    .optional(),
  extra_cost: z
    .object({
      name: z.string().optional(),
      allocate_extracost_type: z
        .enum(
          Object.values(enum_allocate_extra_cost_type) as [string, ...string[]],
        )
        .optional(),
      extra_cost_detail: z
        .object({
          add: z.array(ExtraCostDetailCreate).optional(),
        })
        .optional(),
    })
    .merge(InfoSchema)
    .optional(),
});

export type IGoodReceivedNoteCreate = z.infer<typeof GoodReceivedNoteCreate>;

export class GoodReceivedNoteCreateDto extends createZodDto(
  GoodReceivedNoteCreate,
) {}

export const GoodReceivedNoteDetail_PO_Update = GoodReceivedNoteDetailSchema
.omit({
  purchase_order_detail_id: true,
  inventory_transaction_id: true,
})
.extend({
  tax_type: z
    .enum(Object.values(enum_tax_type) as [string, ...string[]])
    .optional(),
})

export const GoodReceivedNoteDetail_Manual_Update = GoodReceivedNoteDetailSchema
.omit({
  inventory_transaction_id: true,
})
.merge(ReceivedQuantityAndUnitSchema)
.merge(FocSchema);

export const ExtraCostDetailUpdate = ExtraCostDetailCreate.extend({
  id: z.string().uuid(),
})

export const GoodReceivedNoteUpdate = z.object({
  name: z.string().optional(),
  grn_no: z.string().optional(), //genrate by system
  invoice_no: z.string().optional(),
  invoice_f: z.string().datetime().pipe(z.coerce.date()).optional(),
  description: z.string().optional(),
  doc_status: z
    .enum(Object.values(enum_doc_status) as [string, ...string[]])
    .optional(),
  doc_type: z
    .enum(Object.values(enum_good_received_note_type) as [string, ...string[]])
    .optional(),
  vendor_id: z.string().uuid().optional(),
  // vendor_name: z.string().optional(),
  currency_id: z.string().uuid().optional(),
  // currency_name: z.string().optional(),
  currency_rate: z.number().optional(),
  // workflow_id: z.string().uuid().optional(),
  // workflow_obj: z.any().optional(),
  // workflow_history: z.any().optional(),
  // current_workflow_status: z.string().optional(),
  is_consignment: z.boolean().optional(),
  is_cash: z.boolean().optional(),
  signature_image_url: z.string().optional(),
  received_by_id: z.string().uuid().optional(),
  // received_by_name: z.string().optional(),
  received_at: z.string().datetime().pipe(z.coerce.date()).optional(),
  credit_term_id: z.string().uuid().optional(),
  // credit_term_name: z.string().optional(),
  // credit_term_days: z.number().optional(),
  payment_due_date: z.string().datetime().pipe(z.coerce.date()).optional(),
  is_active: z.boolean().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
  dimension: z.any().optional(),
  good_received_note_detail: z.object({
    add: z.array(GoodReceivedNoteDetail_PO_Create || GoodReceivedNoteDetail_Manual_Create).optional(),
    update: z.array(GoodReceivedNoteDetail_PO_Update || GoodReceivedNoteDetail_Manual_Update).optional(),
    remove: z.array(z.object({ id: z.string().uuid() })).optional(),
  }).optional(),
  extra_cost: z.object({
    id: z.string().uuid().optional(),
    name: z.string().optional(),
    allocate_extracost_type: z
      .enum(Object.values(enum_allocate_extra_cost_type) as [string, ...string[]],
      )
      .optional(),
    extra_cost_detail: z.object({
      add: z.array(ExtraCostDetailCreate).optional(),
      update: z.array(ExtraCostDetailUpdate).optional(),
      remove: z.array(z.object({ id: z.string().uuid() })).optional(),
    }).optional(),
  }).optional(),
});

export type IGoodReceivedNoteUpdate = z.infer<typeof GoodReceivedNoteUpdate> & {
  id: string;
};

export class GoodReceivedNoteUpdateDto extends createZodDto(
  GoodReceivedNoteUpdate,
) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Helper function to validate GRN detail items
 */
async function validateGRNDetailItems(
  prisma: PrismaClient,
  items: Array<{ product_id?: string; location_id?: string; tax_profile_id?: string }> | undefined,
  ctx: z.RefinementCtx,
  basePath: string[],
) {
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Validate product_id
    if (item.product_id) {
      const product = await validateProductIdExists(prisma, item.product_id);
      if (!product) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product not found',
          path: [...basePath, i.toString(), 'product_id'],
        });
      }
    }

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
  }
}

/**
 * Create GoodReceivedNoteCreate schema with async database validation
 */
export function createGoodReceivedNoteCreateValidation(prisma: PrismaClient) {
  return GoodReceivedNoteCreate.superRefine(async (data, ctx) => {
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

    // Validate credit_term_id
    if (data.credit_term_id) {
      const creditTerm = await validateCreditTermIdExists(prisma, data.credit_term_id);
      if (!creditTerm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Credit term not found',
          path: ['credit_term_id'],
        });
      }
    }

    // Validate good_received_note_detail.add
    await validateGRNDetailItems(
      prisma,
      data.good_received_note_detail?.add,
      ctx,
      ['good_received_note_detail', 'add'],
    );
  });
}

/**
 * Create GoodReceivedNoteUpdate schema with async database validation
 */
export function createGoodReceivedNoteUpdateValidation(prisma: PrismaClient) {
  return GoodReceivedNoteUpdate.superRefine(async (data, ctx) => {
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

    // Validate credit_term_id
    if (data.credit_term_id) {
      const creditTerm = await validateCreditTermIdExists(prisma, data.credit_term_id);
      if (!creditTerm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Credit term not found',
          path: ['credit_term_id'],
        });
      }
    }

    // Validate good_received_note_detail.add
    await validateGRNDetailItems(
      prisma,
      data.good_received_note_detail?.add,
      ctx,
      ['good_received_note_detail', 'add'],
    );

    // Validate good_received_note_detail.update
    await validateGRNDetailItems(
      prisma,
      data.good_received_note_detail?.update,
      ctx,
      ['good_received_note_detail', 'update'],
    );
  });
}
