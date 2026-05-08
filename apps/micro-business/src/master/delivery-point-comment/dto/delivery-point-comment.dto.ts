import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateDeliveryPointCommentSchema = z.object({
  delivery_point_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateDeliveryPointComment = z.infer<typeof CreateDeliveryPointCommentSchema>;

export class CreateDeliveryPointCommentDto extends createZodDto(CreateDeliveryPointCommentSchema) {}

export const UpdateDeliveryPointCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateDeliveryPointComment = z.infer<typeof UpdateDeliveryPointCommentSchema>;

export class UpdateDeliveryPointCommentDto extends createZodDto(UpdateDeliveryPointCommentSchema) {}

export interface DeliveryPointCommentResponse {
  id: string;
  delivery_point_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
