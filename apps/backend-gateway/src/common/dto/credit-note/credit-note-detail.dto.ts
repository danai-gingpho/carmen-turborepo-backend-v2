import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { EmbeddedDiscountSchema, EmbeddedLocationSchema, EmbeddedTaxSchema, InfoSchema, PriceSchema, ValidateSchema } from '../embedded.dto';

export const CreditNoteDetailSchema = z
  .object({
    id: z.string().uuid(),
    inventory_transaction_id: z.string().uuid().optional(),
    credit_note_id: z.string().uuid(),
    product_id: z.string().uuid(),
    product_name: z.string().optional(),
    product_local_name: z.string().optional(),
  })
  .merge(InfoSchema)
  .merge(EmbeddedLocationSchema)
  .merge(EmbeddedTaxSchema.omit({ total_amount: true }))
  .merge(EmbeddedDiscountSchema)
  .merge(z.object({
    return_qty: ValidateSchema.shape.quantity.optional(),
    return_base_qty: ValidateSchema.shape.quantity.optional(),
    return_unit_id: z.string().uuid().optional(),
    return_conversion_factor: ValidateSchema.shape.price.optional(),
  }))
  .merge(PriceSchema)
  .extend({
    price: ValidateSchema.shape.price.optional(),
    extra_cost_amount: ValidateSchema.shape.price.optional(),
    base_extra_cost_amount: ValidateSchema.shape.price.optional(),
  })

export type CreditNoteDetail = z.infer<typeof CreditNoteDetailSchema>;

export class CreditNoteDetailDto extends createZodDto(CreditNoteDetailSchema) { }
