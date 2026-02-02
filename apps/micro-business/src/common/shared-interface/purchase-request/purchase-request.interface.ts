import { enum_purchase_request_doc_status } from '@repo/prisma-shared-schema-tenant'
export interface IPurchaseRequestDetail {
  id?: string
  purchase_request_id?: string
  sequence_no?: number
  location_id: string
  location_name: string
  delivery_point_id: string
  delivery_point_name: string
  delivery_date: Date
  product_id: string
  product_name: string
  product_local_name?: string
  inventory_unit_id?: string
  inventory_unit_name?: string
  description?: string
  comment?: string
  vendor_id?: string
  vendor_name?: string
  pricelist_detail_id?: string
  pricelist_no?: string
  pricelist_unit?: string
  pricelist_price?: number
  currency_id?: string
  currency_name?: string
  exchange_rate?: number
  exchange_rate_date?: Date
  requested_qty?: number
  requested_unit_id?: string
  requested_unit_name?: string
  requested_unit_conversion_factor?: number
  requested_base_qty?: number
  approved_qty?: number
  approved_unit_id?: string
  approved_unit_name?: string
  approved_unit_conversion_factor?: number
  approved_base_qty?: number
  foc_qty?: number
  foc_unit_id?: string
  foc_unit_name?: string
  foc_unit_conversion_factor?: number
  foc_base_qty?: number
  tax_profile_id?: string
  tax_profile_name?: string
  tax_rate?: number
  tax_amount?: number
  base_tax_amount?: number
  is_tax_adjustment?: boolean
  discount_rate?: number
  discount_amount?: number
  base_discount_amount?: number
  is_discount_adjustment?: boolean
  sub_total_price?: number
  net_amount?: number
  total_price?: number
  base_price?: number
  base_sub_total_price?: number
  base_net_amount?: number
  base_total_price?: number
  history?: any
  stages_status?: any
  info?: any
  dimension?: any
  doc_version?: number
  created_at?: Date
  created_by_id?: string
  updated_at?: Date
  updated_by_id?: string
  deleted_at?: Date
  deleted_by_id?: string;
}

export interface ICreatePurchaseRequest {
  pr_date: Date;
  pr_no?: string;
  pr_status?: enum_purchase_request_doc_status;
  description?: string;
  workflow_id: string;
  requestor_id: string;
  department_id: string;
  note?: string;
  info?: any;
  dimension?: any;
} // deprecated

export interface IPurchaseRequest {
  id: string
  pr_date: Date
  pr_no?: string
  pr_status?: enum_purchase_request_doc_status
  description?: string
  workflow_id: string
  workflow_name: string
  workflow_history?: {
    status?: string;
    timestamp?: Date;
    user?: string;
  }[]
  workflow_current_stage?: string
  workflow_previous_stage?: string
  workflow_next_stage?: string
  user_action?: any
  last_action?: string
  last_action_at_date?: Date
  last_action_by_id?: string
  last_action_by_name?: string
  requestor_id?: string
  requestor_name?: string
  department_id?: string
  department_name?: string
  note?: string
  info?: any
  dimension?: any
  doc_version?: number
  created_at: Date
  created_by_id: string
  updated_at: Date
  updated_by_id: string
  deleted_at?: Date
  deleted_by_id?: string
}

export interface IGetAllPurchaseRequest {
  paginate: {
    total: number;
    page: number;
    perpage: number;
    pages: number;
  };
  data: IPurchaseRequest[];
}

interface HyperPRinerface {
  id: IPurchaseRequest
}

export interface IGetAllResponse {
  paginate: {
    total?: number;
    page?: number;
    perpage?: number;
    pages?: number;
  };
  data: any[];
}