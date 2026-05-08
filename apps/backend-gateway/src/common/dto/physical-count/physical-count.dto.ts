import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ==================== Physical Count Create ====================

export const PhysicalCountCreate = z.object({
  physical_count_period_id: z.string().uuid(),
  location_id: z.string().uuid(),
  description: z.string().optional().nullable(),
});

export type IPhysicalCountCreate = z.infer<typeof PhysicalCountCreate>;
export class PhysicalCountCreateDto extends createZodDto(PhysicalCountCreate) {}

// ==================== Physical Count Update ====================

export const PhysicalCountUpdate = z.object({
  description: z.string().optional().nullable(),
});

export type IPhysicalCountUpdate = z.infer<typeof PhysicalCountUpdate>;
export class PhysicalCountUpdateDto extends createZodDto(PhysicalCountUpdate) {}

// ==================== Physical Count Save (progress) ====================

export const PhysicalCountSave = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      actual_qty: z.number(),
    })
  ),
});

export type IPhysicalCountSave = z.infer<typeof PhysicalCountSave>;
export class PhysicalCountSaveDto extends createZodDto(PhysicalCountSave) {}

// ==================== Physical Count Detail Comment Create ====================

export const PhysicalCountDetailCommentCreate = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      originalName: z.string(),
      fileToken: z.string(),
      contentType: z.string(),
    })
  ).optional().default([]),
});

export type IPhysicalCountDetailCommentCreate = z.infer<typeof PhysicalCountDetailCommentCreate>;
export class PhysicalCountDetailCommentCreateDto extends createZodDto(PhysicalCountDetailCommentCreate) {}
