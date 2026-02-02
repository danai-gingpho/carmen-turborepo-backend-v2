import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateExchangeRateIdExists,
  validateExchangeRateIdsExist,
} from '../../validate/exchange-rate.validate';
import { validateCurrencyIdExists } from '../../validate/currency.validate';

// Re-export validate functions for use with ExchangeRate
export {
  validateExchangeRateIdExists,
  validateExchangeRateIdsExist,
};

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

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create ExchangeRateCreate schema with async database validation
 */
export function createExchangeRateCreateValidation(prisma: PrismaClient) {
  return ExchangeRateCreate.superRefine(async (data, ctx) => {
    if (data.currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency not found',
          path: ['currency_id'],
        });
      }
    }
  });
}

/**
 * Create ExchangeRateUpdate schema with async database validation
 */
export function createExchangeRateUpdateValidation(prisma: PrismaClient) {
  return ExchangeRateUpdate.superRefine(async (data, ctx) => {
    if (data.currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency not found',
          path: ['currency_id'],
        });
      }
    }
  });
}
