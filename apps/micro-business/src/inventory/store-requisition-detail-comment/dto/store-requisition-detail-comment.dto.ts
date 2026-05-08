import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateStoreRequisitionDetailCommentSchema = z.object({
  store_requisition_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateStoreRequisitionDetailComment = z.infer<typeof CreateStoreRequisitionDetailCommentSchema>;

export class CreateStoreRequisitionDetailCommentDto extends createZodDto(CreateStoreRequisitionDetailCommentSchema) {}

export const UpdateStoreRequisitionDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateStoreRequisitionDetailComment = z.infer<typeof UpdateStoreRequisitionDetailCommentSchema>;

export class UpdateStoreRequisitionDetailCommentDto extends createZodDto(UpdateStoreRequisitionDetailCommentSchema) {}

export interface StoreRequisitionDetailCommentResponse {
  id: string;
  store_requisition_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
