import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate product_category_id exists in tb_product_category table
 * @param prisma - PrismaClient instance
 * @param productCategoryId - product_category_id to validate
 * @returns product category data if exists, null if not found
 */
export async function validateProductCategoryIdExists(
  prisma: PrismaClient,
  productCategoryId: string,
): Promise<{ id: string; name: string } | null> {
  if (!productCategoryId) return null;

  const productCategory = await prisma.tb_product_category.findFirst({
    where: { id: productCategoryId },
    select: { id: true, name: true },
  });

  return productCategory;
}

/**
 * Validate product_category_id exists in tb_product_category table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - product_category_id to validate
 * @returns object with valid product categories
 * @throws Error if product category not found
 */
export async function validateProductCategoryIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validProductCategories: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_product_category.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Product Category ID does not exist in the database");
  }

  return {
    validProductCategories: [exists],
  };
}
