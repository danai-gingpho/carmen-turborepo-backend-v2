import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Import validate functions
import {
  validateExchangeRateIdExists,
  validateExchangeRateIdsExist,
} from '../../validate/exchange-rate.validate';
import { validateCurrencyIdExists } from '../../validate/currency.validate';

export const ExchangeRateCreate = z.object({
  at_date: z.union([z.date(), z.string()]).nullable().optional(),
  exchange_rate: z.number().nullable().optional(),
  currency_id: z.string().uuid(),
});

export type ICreateExchangeRate = z.infer<typeof ExchangeRateCreate>;
export class ExchangeRateCreateDto extends createZodDto(ExchangeRateCreate) {}

export const ExchangeRateUpdate = z.object({
  at_date: z.union([z.date(), z.string()]).nullable().optional(),
  exchange_rate: z.number().nullable().optional(),
  currency_id: z.string().uuid().optional(),
});

export type IUpdateExchangeRate = z.infer<typeof ExchangeRateUpdate> & { id: string };
export class ExchangeRateUpdateDto extends createZodDto(ExchangeRateUpdate) {}
