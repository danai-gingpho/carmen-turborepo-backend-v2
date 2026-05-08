import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Re-export validate functions for use with Currency
export {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '../../validate/currency.validate';

export const DefaultCurrencyObject = z.object({
  currency_id: z.string(),
  name: z.string(),
  minimumIntegerDigits: z.number(),
  locales: z.string(),
});

export type IDefaultCurrencyObject = z.infer<typeof DefaultCurrencyObject>;
export class DefaultCurrencyObjectDto extends createZodDto(DefaultCurrencyObject) {}

// Currency Create/Update DTOs
export const CurrenciesCreate = z.object({
  code: z.string(),
  name: z.string(),
  symbol: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  decimal_places: z.number().int().default(2).nullable().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  exchange_rate: z.number().default(1).nullable().optional(),
  exchange_rate_at: z.coerce.date().nullable().optional(),
});

export type ICreateCurrencies = z.infer<typeof CurrenciesCreate>;
export class CurrenciesCreateDto extends createZodDto(CurrenciesCreate) {}

export const CurrenciesUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  decimal_places: z.number().int().optional(),
  is_active: z.boolean().optional(),
  exchange_rate: z.number().optional(),
  exchange_rate_at: z.coerce.date().optional(),
});

export type IUpdateCurrencies = z.infer<typeof CurrenciesUpdate> & { id: string };
export class CurrenciesUpdateDto extends createZodDto(CurrenciesUpdate) {}