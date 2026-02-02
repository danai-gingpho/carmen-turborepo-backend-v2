import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { EmbeddedCurrencySchema, EmbeddedVendorSchema, EmbeddedWorkflowSchema, InfoSchema } from '../embedded.dto'
import { GoodReceivedNoteSchema } from '../good-receive-note/good-received-note.dto'
import { enum_credit_note_doc_status, enum_credit_note_type, PrismaClient } from '@repo/prisma-shared-schema-tenant'

// Import validate functions
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
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '../../validate/datetime.validate';

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