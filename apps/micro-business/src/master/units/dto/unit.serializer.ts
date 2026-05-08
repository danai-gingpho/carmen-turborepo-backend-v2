import { z } from 'zod';

export const UnitResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
});

export type UnitResponse = z.infer<typeof UnitResponseSchema>;

export const UnitDetailResponseSchema = UnitResponseSchema;
export type UnitDetailResponse = z.infer<typeof UnitDetailResponseSchema>;

export const UnitListItemResponseSchema = UnitResponseSchema;
export type UnitListItemResponse = z.infer<typeof UnitListItemResponseSchema>;

export const UnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type UnitMutationResponse = z.infer<typeof UnitMutationResponseSchema>;
