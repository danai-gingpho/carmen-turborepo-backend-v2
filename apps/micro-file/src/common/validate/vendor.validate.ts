import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate vendor_id exists in tb_vendor table
 * @param prisma - PrismaClient instance
 * @param vendorId - vendor_id to validate
 * @returns vendor data if exists, null if not found
 */
export async function validateVendorIdExists(
  prisma: PrismaClient,
  vendorId: string,
): Promise<{ id: string; name: string; code: string } | null> {
  if (!vendorId) return null;

  const vendor = await prisma.tb_vendor.findFirst({
    where: { id: vendorId },
    select: { id: true, name: true, code: true },
  });

  return vendor;
}

/**
 * Validate vendor_id exists in tb_vendor table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - vendor_id to validate
 * @returns object with valid vendors
 * @throws Error if vendor not found
 */
export async function validateVendorIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validVendors: Array<{ id: string; name: string; code: string }>;
}> {
  const exists = await prisma.tb_vendor.findFirst({
    where: { id: id },
    select: { id: true, name: true, code: true },
  });

  if (!exists) {
    throw new Error("Vendor ID does not exist in the database");
  }

  return {
    validVendors: [exists],
  };
}
