import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreditNoteReasonCreate = z.object({
  name: z.string(),
  description: z.string().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
  dimension: z.any().optional(),
});

export type ICreateCreditNoteReason = z.infer<typeof CreditNoteReasonCreate>;
export class CreditNoteReasonCreateDto extends createZodDto(CreditNoteReasonCreate) {}

export const CreditNoteReasonUpdate = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
  dimension: z.any().optional(),
});

export type IUpdateCreditNoteReason = z.infer<typeof CreditNoteReasonUpdate> & { id: string };
export class CreditNoteReasonUpdateDto extends createZodDto(CreditNoteReasonUpdate) {}
