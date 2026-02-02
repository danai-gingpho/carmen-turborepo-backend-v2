import { enum_purchase_request_doc_status } from '@repo/prisma-shared-schema-tenant'

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
      price_per_unit: boolean;
      total_price: boolean;
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

interface Workflow {
  status: string;
  assigned_to: string;
}

interface WorkflowHistory {
  status: string;
  timestamp: string;
  user: string;
}

interface RemovePurchaseRequestDetail {
  id: string;
}

export interface PurchaseRequestDetail {
  id?: string;
  purchase_request_id?: string;
  location_id?: string;
  location_name?: string;
  product_id: string;
  product_name?: string;
  vendor_id?: string;
  vendor_name?: string;
  price_list_detail_id?: string;
  description?: string;
  requested_qty?: number;
  requested_unit_id?: string;
  requested_unit_name?: string;
  approved_qty?: number;
  approved_unit_id?: string;
  approved_unit_name?: string;
  currency_id?: string;
  currency_name?: string;
  exchange_rate?: number;
  exchange_rate_date?: string;
  foc_qty?: number;
  foc_unit_id?: string;
  foc_unit_name?: string;

  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  is_tax_adjustment?: boolean;
  is_discount?: boolean;
  discount_rate?: number;
  discount_amount?: number;
  is_discount_adjustment?: boolean;
  net_amount?: number;
  base_net_amount?: number;

  price?: number;
  total_price?: number;

  received_qty?: number;
  cancelled_qty?: number;
  history?: object;

  base_price?: number;
  base_total_price?: number;

  is_active?: boolean;
  note?: string;
  info?: Pick<Info, 'specifications'>;
  dimension?: Dimension;

  inventory_unit_id?: string;
  inventory_unit_name?: string;

  approved_base_qty?: number;
  // approved_base_unit_id?: string;

  requested_base_qty?: number;
  // requested_base_unit_id?: string;

  requested_unit_conversion_factor?: number;
  approved_unit_conversion_factor?: number;
  
  created_by_id?: string;
  delivery_point_id?: string;
  delivery_point_name?: string;

  pricelist_detail_id?: string;
  pricelist_no?: string;
  tax_type_inventory_name?: string;
}

export interface PurchaseRequest {
  id: string
  pr_no: string
  pr_date: Date
  description?: string
  pr_status: enum_purchase_request_doc_status
  requestor_id: string
  requestor_name: string
  department_id: string
  department_name: string
  doc_version: number
  note?: string
  info?: {
    priority?: string
    budget_code?: string
  }
  dimension?: {
    cost_center?: string
    project?: string
  }
  workflow_id?: string
  workflow_name?: string
  workflow_history?: {
    status?: string
    timestamp?: Date
    user?: string
  }[]
  created_at: Date
  created_by_id: string
  purchase_request_detail?: IPurchaseRequestDetail[]
  updated_at?: Date
  updated_by_id?: string
}

export interface ICreatePurchaseRequest
  extends Omit<PurchaseRequest, 'id' | 'purchase_request_detail'> {
  purchase_request_detail: {
    add: Omit<PurchaseRequestDetail, 'id' | 'purchase_request_id'>[];
  };
}

export interface IUpdatePurchaseRequest
  extends Partial<Omit<PurchaseRequest, 'purchase_request_detail'>> {
  id: string;
  pr_status?: enum_purchase_request_doc_status;
  purchase_request_detail: {
    add?: Omit<PurchaseRequestDetail, 'id' | 'purchase_request_id'>[];
    update?: PurchaseRequestDetail[];
    remove?: RemovePurchaseRequestDetail[];
  };
}

export interface IUpdatePurchaseRequestDetail
  extends Partial<PurchaseRequestDetail> {
  purchase_request_detail: {
    add?: Omit<PurchaseRequestDetail, 'id' | 'purchase_request_id'>[];
    update?: PurchaseRequestDetail;
    remove?: { id: string }[];
  };
}

export interface IPurchaseRequestDetail {
  id?: string
  location_id?: string
  location_name?: string
  product_id?: string
  product_name?: string
  vendor_id?: string
  vendor_name?: string
  price_list_id?: string
  description?: string
  currency_id?: string
  currency_name?: string
  exchange_rate?: number
  price?: number
  total_price?: number
  foc_qty?: number
  foc_unit_id?: string
  foc_unit_name?: string
  tax_profile_id?: string
  tax_profile_name?: string
  tax_rate?: number
  tax_amount?: number
  is_tax_adjustment?: boolean
  is_discount?: boolean
  discount_rate?: number
  discount_amount?: number
  is_discount_adjustment?: boolean
  net_amount?: number
  base_net_amount?: number
  received_qty?: number
  cancelled_qty?: number
  history?: object
  note?: string
  dimension?: {
    cost_center: string
    project: string
  }
  requested_qty?: number
  requested_unit_id?: string
  requested_unit_name?: string
  approved_qty?: number
  approved_unit_id?: string
  approved_unit_name?: string
  approved_base_qty?: number
  approved_base_unit_id?: string
  approved_base_unit_name?: string
  approved_conversion_rate?: number
  requested_conversion_rate?: number
  requested_base_qty?: number
  requested_base_unit_id?: string
  requested_base_unit_name?: string
}

export interface IPurchaseRequest {
  id: string;
  pr_date: Date;
  pr_no: string;
  description?: string;
  workflow_id?: string;
  workflow_obj?: any;
  current_workflow_status?: string;
  pr_status?: enum_purchase_request_doc_status;
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
  workflow_history?: {
    status?: string;
    timestamp?: Date;
    user?: string;
  }[];
  created_at?: Date;
  created_by_id?: string;
  updated_at?: Date;
  updated_by_id?: string;
  tb_purchase_request_detail?: IPurchaseRequestDetail[];
}
