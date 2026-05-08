import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_physical_count_period_status } from '@repo/prisma-shared-schema-tenant';

// ==================== Physical Count Period Create ====================

export const PhysicalCountPeriodCreate = z.object({
  period_id: z.string().uuid(),
  status: z
    .enum(Object.values(enum_physical_count_period_status) as [string, ...string[]])
    .optional()
    .default('draft'),
});

export type IPhysicalCountPeriodCreate = z.infer<typeof PhysicalCountPeriodCreate>;
export class PhysicalCountPeriodCreateDto extends createZodDto(PhysicalCountPeriodCreate) {}

// ==================== Physical Count Period Update ====================

export const PhysicalCountPeriodUpdate = z.object({
  period_id: z.string().uuid().optional(),
  status: z
    .enum(Object.values(enum_physical_count_period_status) as [string, ...string[]])
    .optional(),
});

export type IPhysicalCountPeriodUpdate = z.infer<typeof PhysicalCountPeriodUpdate>;
export class PhysicalCountPeriodUpdateDto extends createZodDto(PhysicalCountPeriodUpdate) {}
