import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_spot_check_method } from '@repo/prisma-shared-schema-tenant';

// ==================== Spot Check Create ====================

export const SpotCheckCreateSchema = z.object({
  location_id: z.string().uuid(),
  method: z.enum(Object.values(enum_spot_check_method) as [string, ...string[]]).optional().default('random'),
  items: z.number().int().positive().optional().nullable(),
  product_id: z.array(z.string().uuid()).optional().nullable(),
  description: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
}).refine(
  (data) => {
    if (data.method === 'manual') {
      return data.product_id && data.product_id.length > 0;
    }
    return true;
  },
  {
    message: 'product_id is required for manual selection',
    path: ['product_id'],
  },
);

export class SpotCheckCreateDto extends createZodDto(SpotCheckCreateSchema) {}
export type ISpotCheckCreate = z.infer<typeof SpotCheckCreateSchema>;

// ==================== Spot Check Update ====================

export const SpotCheckUpdateSchema = z.object({
  description: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
});

export class SpotCheckUpdateDto extends createZodDto(SpotCheckUpdateSchema) {}
export type ISpotCheckUpdate = z.infer<typeof SpotCheckUpdateSchema>;
