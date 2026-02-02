import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Validate exchange_rate_id exists in tb_exchange_rate table
 * @param prisma - PrismaClient instance
 * @param exchangeRateId - exchange_rate_id to validate
 * @returns exchange rate data if exists, null if not found
 */
export async function validateExchangeRateIdExists(
  prisma: PrismaClient,
  exchangeRateId: string,
): Promise<{ id: string; currency_id: string; currency_name: string; currency_code: string; exchange_rate: Decimal } | null> {
  if (!exchangeRateId) return null;

  const exchangeRate = await prisma.tb_exchange_rate.findFirst({
    where: { id: exchangeRateId },
    select: { id: true, currency_id: true, currency_name: true, currency_code: true, exchange_rate: true },
  });

  return exchangeRate;
}

/**
 * Validate exchange_rate_id exists in tb_exchange_rate table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - exchange_rate_id to validate
 * @returns object with valid exchange rates
 * @throws Error if exchange rate not found
 */
export async function validateExchangeRateIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validExchangeRates: Array<{ id: string; currency_id: string; currency_name: string; currency_code: string; exchange_rate: Decimal }>;
}> {
  const exists = await prisma.tb_exchange_rate.findFirst({
    where: { id: id },
    select: { id: true, currency_id: true, currency_name: true, currency_code: true, exchange_rate: true },
  });

  if (!exists) {
    throw new Error("Exchange Rate ID does not exist in the database");
  }

  return {
    validExchangeRates: [exists],
  };
}
