import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateRequestForPricingDetailCommentSchema = z.object({
  request_for_pricing_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateRequestForPricingDetailComment = z.infer<typeof CreateRequestForPricingDetailCommentSchema>;

export class CreateRequestForPricingDetailCommentDto extends createZodDto(CreateRequestForPricingDetailCommentSchema) {}

export const UpdateRequestForPricingDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateRequestForPricingDetailComment = z.infer<typeof UpdateRequestForPricingDetailCommentSchema>;

export class UpdateRequestForPricingDetailCommentDto extends createZodDto(UpdateRequestForPricingDetailCommentSchema) {}

export interface RequestForPricingDetailCommentResponse {
  id: string;
  request_for_pricing_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
