import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ExtraCostTypeCreate = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
  dimension: z.any().optional(),
});

export type ICreateExtraCostType = z.infer<typeof ExtraCostTypeCreate>;
export class ExtraCostTypeCreateDto extends createZodDto(ExtraCostTypeCreate) {}

export const ExtraCostTypeUpdate = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  note: z.string().optional(),
  info: z.any().optional(),
  dimension: z.any().optional(),
});

export type IUpdateExtraCostType = z.infer<typeof ExtraCostTypeUpdate> & {
  id: string;
};
export class ExtraCostTypeUpdateDto extends createZodDto(ExtraCostTypeUpdate) {}
