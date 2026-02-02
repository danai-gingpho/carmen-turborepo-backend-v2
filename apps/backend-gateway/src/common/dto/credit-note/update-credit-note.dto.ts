import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { PrismaClient } from '@repo/prisma-shared-schema-tenant'
import { CreditNoteSchema } from './credit-note.dto'
import { CreditNoteDetailSchema } from './credit-note-detail.dto'

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