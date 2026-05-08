import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { EmbeddedCurrencySchema, EmbeddedVendorSchema, EmbeddedWorkflowSchema, InfoSchema } from '../embedded.dto'
import { GoodReceivedNoteSchema } from '../good-receive-note/good-received-note.dto'
import { enum_credit_note_doc_status, enum_credit_note_type } from '@repo/prisma-shared-schema-tenant'

const OptionalDateTime = z.string().datetime().or(z.literal('')).optional().nullable()

export const CreditNoteSchema = z.object({
  id: z.string().uuid().optional(),
  cn_no: z.string().optional(),
  cn_date: z.string().datetime().optional(),
  doc_status: z.nativeEnum(enum_credit_note_doc_status).optional().default(enum_credit_note_doc_status.draft),
  credit_note_type: z.nativeEnum(enum_credit_note_type),
  description: z.string().optional(),
  cn_reason_id: z.string().uuid().optional(),
  grn_date: OptionalDateTime,
  invoice_no: z.string().optional(),
  invoice_date: OptionalDateTime,
  tax_invoice_no: z.string().optional(),
  tax_invoice_date: OptionalDateTime,
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