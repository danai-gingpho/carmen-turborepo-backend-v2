import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate credit_term_id exists in tb_credit_term table
 * @param prisma - PrismaClient instance
 * @param creditTermId - credit_term_id to validate
 * @returns credit term data if exists, null if not found
 */
export async function validateCreditTermIdExists(
  prisma: PrismaClient,
  creditTermId: string,
): Promise<{ id: string; name: string } | null> {
  if (!creditTermId) return null;

  const creditTerm = await prisma.tb_credit_term.findFirst({
    where: { id: creditTermId },
    select: { id: true, name: true },
  });

  return creditTerm;
}

/**
 * Validate credit_term_id exists in tb_credit_term table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - credit_term_id to validate
 * @returns object with valid credit terms
 * @throws Error if credit term not found
 */
export async function validateCreditTermIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validCreditTerms: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_credit_term.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Credit Term ID does not exist in the database");
  }

  return {
    validCreditTerms: [exists],
  };
}
