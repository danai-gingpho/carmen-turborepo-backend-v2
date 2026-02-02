// ==================== WORKFLOW TYPE DEFINITIONS ====================
// This file contains only interfaces and types for workflow navigation
// The implementation should be in each service that needs it

/**
 * Stage configuration in workflow
 */
export interface Stage {
  sla: string;
  name: string;
  role?: string;
  is_hod?: boolean;
  sla_unit: slaUnit
  description: string;
  hide_fields: object;
  assigned_users: string[];
  creator_access?: creatorAccess
  available_actions: IWorkflowAvailableActions;
}

/**
 * Action configuration for a stage
 */
export interface ActionConfig {
  is_active: boolean;
  recipients: Record<string, boolean>;
}

/**
 * Routing rule for conditional workflow navigation
 */
export interface RoutingRule {
  trigger_stage: string;
  condition: ConditionConfig;
  action: {
    type: string;
    parameters: {
      target_stage: string;
    };
  };
}

/**
 * Condition configuration for routing rules
 */
export interface ConditionConfig {
  field: string;
  operator: 'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'not_eq';
  value: string[];
}

/**
 * Complete workflow configuration
 */
export interface WorkflowData {
  stages: Stage[];
  routing_rules: RoutingRule[];
}

/**
 * Basic stage information
 */
export interface StageInfo {
  name: string;
  sla: string;
  sla_unit: string;
  assigned_users: any[];
  hide_fields: object;
  is_hod?: boolean;
  role?: string
  creator_access?: creatorAccess
}

/**
 * Previous stage with history index
 */
export interface PreviousStageItem {
  stage: string;
  index: number;
}

/**
 * Navigation history information
 */
export interface NavigationHistory {
  history: string[];
  current_index: number;
  current_stage: string | null;
  can_go_back: boolean;
  can_go_forward: boolean;
}

/**
 * Complete navigation information for a stage
 */
export interface NavigationInfo {
  workflow_next_step: string | null;
  workflow_previous_step: string | null;
  available_previous_stages: PreviousStageItem[];
  current_user_action: string[];
  thirdNextStage: string | null;
  next_stage_info: StageInfo | Record<string, never>;
  current_stage_info: StageInfo;
}

/**
 * Result from navigateForward operation
 */
export interface NavigateForwardResult {
  previous_stage: string | null;
  current_stage: string;
  navigation_info: NavigationInfo;
  history: NavigationHistory;
}

/**
 * Result from navigateBackToStage operation
 */
export interface NavigateBackResult {
  previous_stage: string | null;
  current_stage: string | null;
  navigation_info: NavigationInfo;
  history: NavigationHistory;
}


enum slaUnit {
  HOURS = 'hours',
  DAYS = 'days',
}

export enum creatorAccess {
  ALL_PEOPLE_IN_DEPARTMENT_CAN_ACTION = 'all_department'
}

export interface IWorkflowRecipients {
  next_step: boolean;
  requestor: boolean;
  current_approve: boolean;
}

export interface IWorkflowAction {
  is_active: boolean;
  recipients: IWorkflowRecipients;
}

export interface IWorkflowAvailableActions {
  reject: IWorkflowAction;
  submit: IWorkflowAction;
  approve: IWorkflowAction;
  sendback: IWorkflowAction;
}

export interface IWorkflowStage {
  sla: string;
  name: string;
  role?: string;
  is_hod?: boolean;
  sla_unit: slaUnit
  description: string;
  hide_fields: object;
  assigned_users: string[];
  creator_access?: creatorAccess
  available_actions: IWorkflowAvailableActions;
}

export interface IPurchaseRequestWorkflow {
  id: string;
  name: string;
  type: string
  stages: IWorkflowStage[];
  status: string
  products: string[];
  description?: string;
  notifications: unknown[];
  routing_rules: unknown[];
  notification_templates: unknown[];
  document_reference_pattern: string;
}