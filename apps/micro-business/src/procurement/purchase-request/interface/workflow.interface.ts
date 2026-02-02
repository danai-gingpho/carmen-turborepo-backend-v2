import { state_status } from '@/common';
import { enum_last_action } from '@repo/prisma-shared-schema-tenant';

export interface UserActionProfile {
  user_id: string;
  email: string;
  firstname: string;
  middlename: string;
  lastname: string;
  initials: string;
  department: {
    id: string;
    name: string;
  } | null;
}

export interface WorkflowHeader {
  workflow_previous_stage: string;
  workflow_current_stage: string;
  workflow_next_stage: string;
  user_action: { execute: UserActionProfile[] };
  last_action: enum_last_action;
  last_action_at_date: string | Date;
  last_action_by_id: string;
  last_action_by_name: string;
  workflow_history: WorkflowHistory[];
}

interface WorkflowHistory {
  action: enum_last_action;
  datetime: string | Date;
  user: {
    id: string;
    name: string;
  };
  current_stage: string;
  next_stage: string;
}

export interface StageStatus {
  seq: number;
  status: state_status;
  name: string;
  message: string;
}
