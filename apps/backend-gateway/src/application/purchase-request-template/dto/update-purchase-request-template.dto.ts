import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema for tb_purchase_request_template_detail (for add/update operations)
// Note: *_name fields (location_name, product_name, requested_unit_name, foc_unit_name) are populated by mapper
const PurchaseRequestTemplateDetailSchema = z.object({
  location_id: z.string().uuid().optional().nullable(),
  delivery_point_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid(),
  product_local_name: z.string().optional().nullable(),
  inventory_unit_id: z.string().uuid().optional().nullable(),
  inventory_unit_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  currency_id: z.string().uuid().optional().nullable(),
  exchange_rate: z.number().optional().default(1),
  exchange_rate_date: z.string().datetime().optional().nullable(),
  requested_qty: z.number().optional().default(0),
  requested_unit_id: z.string().uuid().optional().nullable(),
  requested_unit_conversion_factor: z.number().optional().default(1),
  requested_base_qty: z.number().optional().default(0),
  foc_qty: z.number().optional().default(0),
  foc_unit_id: z.string().uuid().optional().nullable(),
  foc_unit_conversion_factor: z.number().optional().default(1),
  foc_base_qty: z.number().optional().default(0),
  tax_profile_id: z.string().uuid().optional().nullable(),
  tax_profile_name: z.string().optional().nullable(),
  tax_rate: z.number().optional().default(0),
  tax_amount: z.number().optional().default(0),
  base_tax_amount: z.number().optional().default(0),
  is_tax_adjustment: z.boolean().optional().default(false),
  discount_rate: z.number().optional().default(0),
  discount_amount: z.number().optional().default(0),
  base_discount_amount: z.number().optional().default(0),
  is_discount_adjustment: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  info: z.any().optional().default({}),
  dimension: z.any().optional().default([]),
});

// Schema for update with id required
const UpdatePurchaseRequestTemplateDetailSchema = PurchaseRequestTemplateDetailSchema.extend({
  id: z.string().uuid(),
});

// Schema for tb_purchase_request_template (update)
// Note: workflow_name and department_name are populated by mapper from their corresponding *_id fields
const UpdatePurchaseRequestTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  workflow_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
  note: z.string().optional().nullable(),
  info: z.any().optional(),
  dimension: z.any().optional(),
  purchase_request_template_detail: z.object({
    add: z.array(PurchaseRequestTemplateDetailSchema).optional(),
    update: z.array(UpdatePurchaseRequestTemplateDetailSchema).optional(),
    delete: z.array(z.object({ id: z.string().uuid() })).optional(),
  }).optional(),
});

export type UpdatePurchaseRequestTemplate = z.infer<
  typeof UpdatePurchaseRequestTemplateSchema
>;

export class UpdatePurchaseRequestTemplateDto extends createZodDto(
  UpdatePurchaseRequestTemplateSchema,
) { }
