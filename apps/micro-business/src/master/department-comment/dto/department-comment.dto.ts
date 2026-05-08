import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateDepartmentCommentSchema = z.object({
  department_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateDepartmentComment = z.infer<typeof CreateDepartmentCommentSchema>;

export class CreateDepartmentCommentDto extends createZodDto(CreateDepartmentCommentSchema) {}

export const UpdateDepartmentCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateDepartmentComment = z.infer<typeof UpdateDepartmentCommentSchema>;

export class UpdateDepartmentCommentDto extends createZodDto(UpdateDepartmentCommentSchema) {}

export interface DepartmentCommentResponse {
  id: string;
  department_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
