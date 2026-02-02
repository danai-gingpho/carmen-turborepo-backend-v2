import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreditTermCreate = z.object({
  name: z.string(),
  value: z.number().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
});

export type ICreateCreditTerm = z.infer<typeof CreditTermCreate>;
export class CreditTermCreateDto extends createZodDto(CreditTermCreate) {}

export const CreditTermUpdate = z.object({
  name: z.string().optional(),
  value: z.number().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
});

export type IUpdateCreditTerm = z.infer<typeof CreditTermUpdate> & { id: string };
export class CreditTermUpdateDto extends createZodDto(CreditTermUpdate) {}
