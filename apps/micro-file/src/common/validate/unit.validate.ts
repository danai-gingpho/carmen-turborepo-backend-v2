import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate unit_id exists in tb_unit table
 * @param prisma - PrismaClient instance
 * @param unitId - unit_id to validate
 * @returns unit data if exists, null if not found
 */
export async function validateUnitIdExists(
  prisma: PrismaClient,
  unitId: string,
): Promise<{ id: string; name: string } | null> {
  if (!unitId) return null;

  const unit = await prisma.tb_unit.findFirst({
    where: { id: unitId },
    select: { id: true, name: true },
  });

  return unit;
}

/**
 * Validate unit_id exists in tb_unit table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - unit_id to validate
 * @returns object with valid units
 * @throws Error if unit not found
 */
export async function validateUnitIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validUnits: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_unit.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Unit ID does not exist in the database");
  }

  return {
    validUnits: [exists],
  };
}
