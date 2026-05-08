import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate currency_id exists in tb_currency table
 * @param prisma - PrismaClient instance
 * @param currencyId - currency_id to validate
 * @returns currency data if exists, null if not found
 */
export async function validateCurrencyIdExists(
  prisma: PrismaClient,
  currencyId: string,
): Promise<{ id: string; name: string; code: string } | null> {
  if (!currencyId) return null;

  const currency = await prisma.tb_currency.findFirst({
    where: { id: currencyId },
    select: { id: true, name: true, code: true },
  });

  return currency;
}

/**
 * Validate currency_id exists in tb_currency table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - currency_id to validate
 * @returns object with valid currencies
 * @throws Error if currency not found
 */
export async function validateCurrencyIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validCurrencies: Array<{ id: string; name: string; code: string }>;
}> {
  const exists = await prisma.tb_currency.findFirst({
    where: { id: id },
    select: { id: true, name: true, code: true },
  });

  if (!exists) {
    throw new Error("Currency ID does not exist in the database");
  }

  return {
    validCurrencies: [exists],
  };
}
