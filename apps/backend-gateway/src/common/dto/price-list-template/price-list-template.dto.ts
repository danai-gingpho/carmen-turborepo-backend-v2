import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { InfoSchema, EmbeddedProductSchema } from '../embedded.dto';

export const PriceListTemplateStatusEnum = z.enum(['draft', 'active', 'inactive']);

export const PriceListTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  status: PriceListTemplateStatusEnum.optional().default('draft'),

  // Currency and validity
  currency_id: z.string().uuid().optional().nullable(),
  currency_name: z.string().optional().nullable(),
  validity_period: z.number().int().optional().nullable(), // number of days

  // Vendor instructions
  vendor_instructions: z.string().optional().nullable(),

  // Notification settings
  send_reminders: z.boolean().optional().default(false),
  reminder_days: z.array(z.number()).optional().default([]), // array of days before deadline
  escalation_after_days: z.number().int().optional().nullable(), // number of days after which to escalate

  doc_version: z.number().optional().default(0),
})
.merge(InfoSchema);

export const PriceListTemplateDetailSchema = z.object({
  id: z.string().uuid(),
  pricelist_template_id: z.string().uuid(),
  sequence_no: z.number().optional().default(1),
  product_name: z.string().optional().nullable(),
  array_order_unit: z.array(z.object({
    unit_id: z.string().uuid(),
    unit_name: z.string()
  })).optional().default([]),
  doc_version: z.number().optional().default(0),
})
.merge(EmbeddedProductSchema)
.merge(InfoSchema);

export const PriceListTemplateCreate = PriceListTemplateSchema.omit({
  id: true,
  doc_version: true,
});

export type IPriceListTemplateCreate = z.infer<typeof PriceListTemplateCreate>;

export class PriceListTemplateCreateDto extends createZodDto(PriceListTemplateCreate) {}

export const PriceListTemplateUpdate = PriceListTemplateSchema.partial();

export type IPriceListTemplateUpdate = z.infer<typeof PriceListTemplateUpdate> & {
  id: string;
};

export class PriceListTemplateUpdateDto extends createZodDto(
  PriceListTemplateUpdate,
) {}

export const PriceListTemplateDetailCreate = PriceListTemplateDetailSchema.omit({
  id: true,
  doc_version: true,
});

export type IPriceListTemplateDetailCreate = z.infer<typeof PriceListTemplateDetailCreate>;

export class PriceListTemplateDetailCreateDto extends createZodDto(PriceListTemplateDetailCreate) {}

export const PriceListTemplateDetailUpdate = PriceListTemplateDetailSchema.partial();

export type IPriceListTemplateDetailUpdate = z.infer<typeof PriceListTemplateDetailUpdate> & {
  id: string;
};

export class PriceListTemplateDetailUpdateDto extends createZodDto(
  PriceListTemplateDetailUpdate,
) {}
