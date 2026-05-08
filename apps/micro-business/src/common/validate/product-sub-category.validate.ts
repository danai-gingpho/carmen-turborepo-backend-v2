import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate product_sub_category_id exists in tb_product_sub_category table
 * @param prisma - PrismaClient instance
 * @param productSubCategoryId - product_sub_category_id to validate
 * @returns product sub category data if exists, null if not found
 */
export async function validateProductSubCategoryIdExists(
  prisma: PrismaClient,
  productSubCategoryId: string,
): Promise<{ id: string; name: string } | null> {
  if (!productSubCategoryId) return null;

  const productSubCategory = await prisma.tb_product_sub_category.findFirst({
    where: { id: productSubCategoryId },
    select: { id: true, name: true },
  });

  return productSubCategory;
}

/**
 * Validate product_sub_category_id exists in tb_product_sub_category table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - product_sub_category_id to validate
 * @returns object with valid product sub categories
 * @throws Error if product sub category not found
 */
export async function validateProductSubCategoryIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validProductSubCategories: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_product_sub_category.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Product Sub Category ID does not exist in the database");
  }

  return {
    validProductSubCategories: [exists],
  };
}
