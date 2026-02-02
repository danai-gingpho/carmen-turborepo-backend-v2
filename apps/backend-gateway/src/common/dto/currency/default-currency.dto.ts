import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

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
  is_active: z.boolean().default(true).nullable().optional(),
  exchange_rate: z.number().default(1).nullable().optional(),
});

export type ICreateCurrencies = z.infer<typeof CurrenciesCreate>;
export class CurrenciesCreateDto extends createZodDto(CurrenciesCreate) {}

export const CurrenciesUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  exchange_rate: z.number().optional(),
});

export type IUpdateCurrencies = z.infer<typeof CurrenciesUpdate> & { id: string };
export class CurrenciesUpdateDto extends createZodDto(CurrenciesUpdate) {}