import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { PrismaClient } from '@repo/prisma-shared-schema-tenant'
import { CreditNoteSchema } from './credit-note.dto'
import { CreditNoteDetailSchema } from './credit-note-detail.dto'

export const CreateCreditNoteSchema = CreditNoteSchema.omit({
  id: true,
})
.extend({
  credit_note_detail: z.object({
    add: z.array(CreditNoteDetailSchema.omit({
      id: true,
      credit_note_id: true,
    })).optional(),
  }).optional()
})

export class CreateCreditNoteDto extends createZodDto(CreateCreditNoteSchema) {}