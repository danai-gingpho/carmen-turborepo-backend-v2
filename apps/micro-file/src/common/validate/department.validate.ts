import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate department_id exists in tb_department table
 * @param prisma - PrismaClient instance
 * @param departmentId - department_id to validate
 * @returns department data if exists, null if not found
 */
export async function validateDepartmentIdExists(
  prisma: PrismaClient,
  departmentId: string,
): Promise<{ id: string; name: string; code: string } | null> {
  if (!departmentId) return null;

  const department = await prisma.tb_department.findFirst({
    where: { id: departmentId },
    select: { id: true, name: true, code: true },
  });

  return department;
}

/**
 * Validate department_id exists in tb_department table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - department_id to validate
 * @returns object with valid departments
 * @throws Error if department not found
 */
export async function validateDepartmentIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validDepartments: Array<{ id: string; name: string; code: string }>;
}> {
  const exists = await prisma.tb_department.findFirst({
    where: { id: id },
    select: { id: true, name: true, code: true },
  });

  if (!exists) {
    throw new Error("Department ID does not exist in the database");
  }

  return {
    validDepartments: [exists],
  };
}
