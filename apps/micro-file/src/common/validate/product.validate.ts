import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate product_id exists in tb_product table
 * @param prisma - PrismaClient instance
 * @param productId - product_id to validate
 * @returns product data if exists, null if not found
 */
export async function validateProductIdExists(
  prisma: PrismaClient,
  productId: string,
): Promise<{ id: string; name: string; code: string } | null> {
  if (!productId) return null;

  const product = await prisma.tb_product.findFirst({
    where: { id: productId },
    select: { id: true, name: true, code: true },
  });

  return product;
}

/**
 * Validate product_id exists in tb_product table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - product_id to validate
 * @returns object with valid products
 * @throws Error if product not found
 */
export async function validateProductIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validProducts: Array<{ id: string; name: string; code: string }>;
}> {
  const exists = await prisma.tb_product.findFirst({
    where: { id: id },
    select: { id: true, name: true, code: true },
  });

  if (!exists) {
    throw new Error("Product ID does not exist in the database");
  }

  return {
    validProducts: [exists],
  };
}
