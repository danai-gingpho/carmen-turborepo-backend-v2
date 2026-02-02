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
