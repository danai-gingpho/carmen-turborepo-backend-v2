import { z } from 'zod';

export const CreditNoteReasonDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  info: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
});

export const CreditNoteReasonListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  info: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
});

export const CreditNoteReasonMutationResponseSchema = z.object({
  id: z.string(),
});

export type CreditNoteReasonDetailResponse = z.infer<typeof CreditNoteReasonDetailResponseSchema>;
export type CreditNoteReasonListItemResponse = z.infer<typeof CreditNoteReasonListItemResponseSchema>;
export type CreditNoteReasonMutationResponse = z.infer<typeof CreditNoteReasonMutationResponseSchema>;
