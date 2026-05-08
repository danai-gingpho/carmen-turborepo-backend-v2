import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

export const CreditNoteReasonDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
});

export const CreditNoteReasonListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
});

export const CreditNoteReasonMutationResponseSchema = z.object({
  id: z.string(),
});

export type CreditNoteReasonDetailResponse = z.infer<typeof CreditNoteReasonDetailResponseSchema>;
export type CreditNoteReasonListItemResponse = z.infer<typeof CreditNoteReasonListItemResponseSchema>;
export type CreditNoteReasonMutationResponse = z.infer<typeof CreditNoteReasonMutationResponseSchema>;
