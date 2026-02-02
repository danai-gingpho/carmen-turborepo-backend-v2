import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Re-export validate functions for use with TaxProfile
export {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '../../validate/tax-profile.validate';

export const TaxProfileCreate = z.object({
  name: z.string(),
  tax_rate: z.number().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
});

export type ICreateTaxProfile = z.infer<typeof TaxProfileCreate>;
export class TaxProfileCreateDto extends createZodDto(TaxProfileCreate) {}

export const TaxProfileUpdate = z.object({
  name: z.string().optional(),
  tax_rate: z.number().optional(),
  is_active: z.boolean().optional(),
});

export type IUpdateTaxProfile = z.infer<typeof TaxProfileUpdate> & { id: string };
export class TaxProfileUpdateDto extends createZodDto(TaxProfileUpdate) {}
