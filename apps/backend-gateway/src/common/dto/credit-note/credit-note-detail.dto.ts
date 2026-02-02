import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { EmbeddedLocationSchema, EmbeddedTaxSchema, InfoSchema, PriceSchema, ValidateSchema } from '../embedded.dto';

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
