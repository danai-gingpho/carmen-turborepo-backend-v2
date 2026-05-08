import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateRequestForPricingCommentSchema = z.object({
  request_for_pricing_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateRequestForPricingComment = z.infer<typeof CreateRequestForPricingCommentSchema>;

export class CreateRequestForPricingCommentDto extends createZodDto(CreateRequestForPricingCommentSchema) {}

export const UpdateRequestForPricingCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateRequestForPricingComment = z.infer<typeof UpdateRequestForPricingCommentSchema>;

export class UpdateRequestForPricingCommentDto extends createZodDto(UpdateRequestForPricingCommentSchema) {}

export interface RequestForPricingCommentResponse {
  id: string;
  request_for_pricing_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
