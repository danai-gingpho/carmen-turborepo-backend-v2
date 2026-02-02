import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreatePurchaseRequestTemplateDetailSchema } from './purchase-requesr-template.dto';

// Schema for update with id required
const UpdatePurchaseRequestTemplateDetailSchema = CreatePurchaseRequestTemplateDetailSchema.extend({
  id: z.string().uuid(),
});

// Schema for tb_purchase_request_template (update)
// Note: workflow_name and department_name are populated by mapper from their corresponding *_id fields
export const UpdatePurchaseRequestTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  workflow_id: z.string().uuid().optional().nullable(),
  workflow_name: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  department_name: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  note: z.string().optional().nullable(),
  info: z.any().optional(),
  dimension: z.any().optional(),
  purchase_request_template_detail: z.object({
    add: z.array(CreatePurchaseRequestTemplateDetailSchema).optional(),
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
