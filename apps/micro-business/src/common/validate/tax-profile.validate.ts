import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate tax_profile_id exists in tb_tax_profile table
 * @param prisma - PrismaClient instance
 * @param taxProfileId - tax_profile_id to validate
 * @returns tax profile data if exists, null if not found
 */
export async function validateTaxProfileIdExists(
  prisma: PrismaClient,
  taxProfileId: string,
): Promise<{ id: string; name: string } | null> {
  if (!taxProfileId) return null;

  const taxProfile = await prisma.tb_tax_profile.findFirst({
    where: { id: taxProfileId },
    select: { id: true, name: true },
  });

  return taxProfile;
}

/**
 * Validate tax_profile_id exists in tb_tax_profile table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - tax_profile_id to validate
 * @returns object with valid tax profiles
 * @throws Error if tax profile not found
 */
export async function validateTaxProfileIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validTaxProfiles: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_tax_profile.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Tax Profile ID does not exist in the database");
  }

  return {
    validTaxProfiles: [exists],
  };
}
