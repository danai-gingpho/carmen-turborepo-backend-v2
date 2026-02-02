import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate delivery_point_id exists in tb_delivery_point table
 * @param prisma - PrismaClient instance
 * @param deliveryPointId - delivery_point_id to validate
 * @returns delivery point data if exists, null if not found
 */
export async function validateDeliveryPointIdExists(
  prisma: PrismaClient,
  deliveryPointId: string,
): Promise<{ id: string; name: string } | null> {
  if (!deliveryPointId) return null;

  const deliveryPoint = await prisma.tb_delivery_point.findFirst({
    where: { id: deliveryPointId },
    select: { id: true, name: true },
  });

  return deliveryPoint;
}

/**
 * Validate delivery_point_id exists in tb_delivery_point table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - delivery_point_id to validate
 * @returns object with valid delivery points
 * @throws Error if delivery point not found
 */
export async function validateDeliveryPointIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validDeliveryPoints: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_delivery_point.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Delivery Point ID does not exist in the database");
  }

  return {
    validDeliveryPoints: [exists],
  };
}
