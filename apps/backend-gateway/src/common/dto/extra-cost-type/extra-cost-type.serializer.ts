import { z } from 'zod';

// Base schema for ExtraCostType
const ExtraCostTypeBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),
});

// Detail response schema (for findOne)
export const ExtraCostTypeDetailResponseSchema = ExtraCostTypeBaseSchema.passthrough();

// List item response schema (for findAll)
export const ExtraCostTypeListItemResponseSchema = ExtraCostTypeBaseSchema.passthrough();

// Mutation response schema (for create, update, delete)
export const ExtraCostTypeMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
