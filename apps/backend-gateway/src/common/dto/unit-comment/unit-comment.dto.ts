import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ==================== Unit Comment Create ====================

export const UnitCommentCreate = z.object({
  unit_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  attachments: z.any().optional().nullable(),
});

export type IUnitCommentCreate = z.infer<typeof UnitCommentCreate>;
export class UnitCommentCreateDto extends createZodDto(UnitCommentCreate) {}

// ==================== Unit Comment Update ====================

export const UnitCommentUpdate = z.object({
  message: z.string().optional().nullable(),
  attachments: z.any().optional().nullable(),
});

export type IUnitCommentUpdate = z.infer<typeof UnitCommentUpdate>;
export class UnitCommentUpdateDto extends createZodDto(UnitCommentUpdate) {}
