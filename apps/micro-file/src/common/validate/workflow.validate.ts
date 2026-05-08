import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

/**
 * Validate workflow_id exists in tb_workflow table
 * @param prisma - PrismaClient instance
 * @param workflowId - workflow_id to validate
 * @returns workflow data if exists, null if not found
 */
export async function validateWorkflowIdExists(
  prisma: PrismaClient,
  workflowId: string,
): Promise<{ id: string; name: string } | null> {
  if (!workflowId) return null;

  const workflow = await prisma.tb_workflow.findFirst({
    where: { id: workflowId },
    select: { id: true, name: true },
  });

  return workflow;
}

/**
 * Validate workflow_id exists in tb_workflow table (throws error if not found)
 * @param prisma - PrismaClient instance
 * @param id - workflow_id to validate
 * @returns object with valid workflows
 * @throws Error if workflow not found
 */
export async function validateWorkflowIdsExist(
  prisma: PrismaClient,
  id: string,
): Promise<{
  validWorkflows: Array<{ id: string; name: string }>;
}> {
  const exists = await prisma.tb_workflow.findFirst({
    where: { id: id },
    select: { id: true, name: true },
  });

  if (!exists) {
    throw new Error("Workflow ID does not exist in the database");
  }

  return {
    validWorkflows: [exists],
  };
}
