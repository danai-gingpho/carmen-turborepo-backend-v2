import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate product_item_group_id exists in tb_product_item_group table
 * @param prisma - PrismaClient instance
 * @param productItemGroupId - product_item_group_id to validate
 * @returns product item group data if exists, null if not found
 */
export async function validateProductItemGroupIdExists(
  prisma: PrismaClient,
  productItemGroupId: string,
): Promise<{ id: string; name: string } | null> {
  if (!productItemGroupId) return null;

  const productItemGroup = await prisma.tb_product_item_group.findFirst({
    where: { id: productItemGroupId },
    select: { id: true, name: true },
  });

  return productItemGroup;
}

/**
 * Validate product_item_group_id exists in tb_product_item_group table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - product_item_group_id to validate
 * @returns object with valid product item groups
 * @throws Error if product item group not found
 */
export async function validateProductItemGroupIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validProductItemGroups: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_product_item_group.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Product Item Group ID does not exist in the database");
  }

  return {
    validProductItemGroups: [exists],
  };
}
