import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate price_list_id exists in tb_pricelist table
 * @param prisma - PrismaClient instance
 * @param priceListId - price_list_id to validate
 * @returns price list data if exists, null if not found
 */
export async function validatePriceListIdExists(
  prisma: PrismaClient,
  priceListId: string,
): Promise<{ id: string; name: string } | null> {
  if (!priceListId) return null;

  const priceList = await prisma.tb_pricelist.findFirst({
    where: { id: priceListId },
    select: { id: true, name: true },
  });

  return priceList;
}

/**
 * Validate price_list_id exists in tb_pricelist table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - price_list_id to validate
 * @returns object with valid price lists
 * @throws Error if price list not found
 */
export async function validatePriceListIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validPriceLists: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_pricelist.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Price List ID does not exist in the database");
  }

  return {
    validPriceLists: [exists],
  };
}
