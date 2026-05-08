import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate location_id exists in tb_location table
 * @param prisma - PrismaClient instance
 * @param locationId - location_id to validate
 * @returns location data if exists, null if not found
 */
export async function validateLocationIdExists(
  prisma: PrismaClient,
  locationId: string,
): Promise<{ id: string; name: string; code: string } | null> {
  if (!locationId) return null;

  const location = await prisma.tb_location.findFirst({
    where: { id: locationId },
    select: { id: true, name: true, code: true },
  });

  return location;
}

/**
 * Validate location_id exists in tb_location table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - location_id to validate
 * @returns object with valid locations
 * @throws Error if location not found
 */
export async function validateLocationIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validLocations: Array<{ id: string; name: string; code: string }>;
}> {
  const exists = await prisma.tb_location.findFirst({
    where: { id: id },
    select: { id: true, name: true, code: true },
  });

  if (!exists) {
    throw new Error("Location ID does not exist in the database");
  }

  return {
    validLocations: [exists],
  };
}
