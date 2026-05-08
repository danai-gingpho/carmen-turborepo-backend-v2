import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePhysicalCountPeriodCommentSchema = z.object({
  physical_count_period_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePhysicalCountPeriodComment = z.infer<typeof CreatePhysicalCountPeriodCommentSchema>;

export class CreatePhysicalCountPeriodCommentDto extends createZodDto(CreatePhysicalCountPeriodCommentSchema) {}

export const UpdatePhysicalCountPeriodCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePhysicalCountPeriodComment = z.infer<typeof UpdatePhysicalCountPeriodCommentSchema>;

export class UpdatePhysicalCountPeriodCommentDto extends createZodDto(UpdatePhysicalCountPeriodCommentSchema) {}

export interface PhysicalCountPeriodCommentResponse {
  id: string;
  physical_count_period_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
