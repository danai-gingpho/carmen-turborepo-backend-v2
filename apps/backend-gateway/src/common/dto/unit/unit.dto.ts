import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const UnitsCreate = z.object({
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
});

export type ICreateUnits = z.infer<typeof UnitsCreate>;
export class UnitsCreateDto extends createZodDto(UnitsCreate) {}

export const UnitsUpdate = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type IUpdateUnits = z.infer<typeof UnitsUpdate> & { id: string };
export class UnitsUpdateDto extends createZodDto(UnitsUpdate) {}
