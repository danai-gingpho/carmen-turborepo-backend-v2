import { enum_doc_status, enum_last_action } from '@repo/prisma-shared-schema-tenant';

export interface WorkflowObj {
  document_reference_pattern: string;
  stages: {
    name: string;
    description: string;
    sla: string;
    sla_unit: string;
    available_actions: {
      submit: {
        is_active: boolean;
        recipients: {
          requestor: boolean;
          current_approve: boolean;
          next_step: boolean;
        };
      };
      approve: {
        is_active: boolean;
        recipients: {
          requestor: boolean;
          current_approve: boolean;
          next_step: boolean;
        };
      };
      reject: {
        is_active: boolean;
        recipients: {
          requestor: boolean;
          current_approve: boolean;
          next_step: boolean;
        };
      };
      sendback: {
        is_active: boolean;
        recipients: {
          requestor: boolean;
          current_approve: boolean;
          next_step: boolean;
        };
      };
    };
    hide_fields: {
      requested_qty: boolean;
      approved_qty: boolean;
    };
    assigned_users: [];
  }[];
  routing_rules: [
    {
      name: string;
      description: string;
      trigger_stage: string;
      condition: {
        field: string;
        operator: string;
        value: string;
      };
      action: {
        type: string;
        parameters: {
          target_stage: string;
        };
      };
    },
  ];
}

interface Dimension {
  cost_center: string;
  project: string;
}

interface Info {
  priority?: string;
  budget_code?: string;
  specifications?: string;
}

interface WorkflowHistory {
  status: string;
  timestamp: string;
  user: string;
}

interface RemoveStoreRequisitionDetail {
  id: string;
}

export interface StoreRequisitionDetail {
  id?: string;
  store_requisition_id?: string;
  sequence_no?: number;
  description?: string;
  product_id: string;
  product_name?: string;
  product_local_name?: string;
  requested_qty?: number;
  approved_qty?: number;
  issued_qty?: number;
  last_action?: string;
  approved_message?: string;
  approved_by_id?: string;
  approved_by_name?: string;
  approved_date_at?: string;
  review_message?: string;
  review_by_id?: string;
  review_by_name?: string;
  review_date_at?: string;
  reject_message?: string;
  reject_by_id?: string;
  reject_by_name?: string;
  reject_date_at?: string;
  history?: object;
  stages_status?: any;
  current_stage_status?: string;
  info?: Pick<Info, 'specifications'>;
  dimension?: Dimension;
  created_by_id?: string;
}

export interface StoreRequisition {
  id: string;
  sr_no: string;
  sr_date: Date;
  expected_date?: Date;
  description?: string;
  doc_status: enum_doc_status;
  from_location_id?: string;
  from_location_code?: string;
  from_location_name?: string;
  to_location_id?: string;
  to_location_code?: string;
  to_location_name?: string;
  workflow_id?: string;
  workflow_name?: string;
  workflow_history?: WorkflowHistory[];
  workflow_current_stage?: string;
  workflow_previous_stage?: string;
  workflow_next_stage?: string;
  user_action?: any;
  requestor_id?: string;
  requestor_name?: string;
  department_id?: string;
  department_name?: string;
  doc_version: number;
  note?: string;
  info?: {
    priority?: string;
    budget_code?: string;
  };
  dimension?: {
    cost_center?: string;
    project?: string;
  };
  created_at: Date;
  created_by_id: string;
  store_requisition_detail?: IStoreRequisitionDetail[];
  updated_at?: Date;
  updated_by_id?: string;
}

export interface ICreateStoreRequisition
  extends Omit<StoreRequisition, 'id' | 'store_requisition_detail'> {
  store_requisition_detail: {
    add: Omit<StoreRequisitionDetail, 'id' | 'store_requisition_id'>[];
  };
}

export interface IUpdateStoreRequisition
  extends Partial<Omit<StoreRequisition, 'store_requisition_detail'>> {
  id: string;
  doc_status?: enum_doc_status;
  store_requisition_detail: {
    add?: Omit<StoreRequisitionDetail, 'id' | 'store_requisition_id'>[];
    update?: StoreRequisitionDetail[];
    remove?: RemoveStoreRequisitionDetail[];
  };
}

export interface IUpdateStoreRequisitionDetail
  extends Partial<StoreRequisitionDetail> {
  store_requisition_detail: {
    add?: Omit<StoreRequisitionDetail, 'id' | 'store_requisition_id'>[];
    update?: StoreRequisitionDetail;
    remove?: { id: string }[];
  };
}

export interface IStoreRequisitionDetail {
  id?: string;
  store_requisition_id?: string;
  sequence_no?: number;
  description?: string;
  product_id: string;
  product_name?: string;
  product_local_name?: string;
  requested_qty?: number;
  approved_qty?: number;
  issued_qty?: number;
  last_action?: enum_last_action;
  approved_message?: string;
  approved_by_id?: string;
  approved_by_name?: string;
  review_message?: string;
  review_by_id?: string;
  review_by_name?: string;
  reject_message?: string;
  reject_by_id?: string;
  reject_by_name?: string;
  history?: object;
  stages_status?: any;
  current_stage_status?: string;
  info?: object;
  dimension?: {
    cost_center: string;
    project: string;
  };
}

export interface IStoreRequisition {
  id: string;
  sr_date: Date;
  sr_no: string;
  expected_date?: Date;
  description?: string;
  doc_status?: enum_doc_status;
  from_location_id?: string;
  from_location_code?: string;
  from_location_name?: string;
  to_location_id?: string;
  to_location_code?: string;
  to_location_name?: string;
  workflow_id?: string;
  workflow_name?: string;
  workflow_obj?: any;
  workflow_history?: WorkflowHistory[];
  workflow_current_stage?: string;
  workflow_previous_stage?: string;
  workflow_next_stage?: string;
  user_action?: any;
  current_workflow_status?: string;
  requestor_id?: string;
  requestor_name?: string;
  department_id?: string;
  department_name?: string;
  is_active?: boolean;
  doc_version?: number;
  note?: string;
  info?: {
    priority?: string;
    budget_code?: string;
  };
  dimension?: {
    cost_center?: string;
    project?: string;
  };
  created_at?: Date;
  created_by_id?: string;
  updated_at?: Date;
  updated_by_id?: string;
  tb_store_requisition_detail?: IStoreRequisitionDetail[];
}
