import { enum_workflow_type } from "@repo/prisma-shared-schema-tenant";

export interface ICreateWorkflow {
  name: string;
  workflow_type: enum_workflow_type;
  description?: string;
  data?: object;
  is_active?: boolean;
}

export interface IUpdateWorkflow {
  id: string;
  name?: string;
  workflow_type?: enum_workflow_type;
  description?: string;
  data?: object;
  is_active?: boolean;
}
