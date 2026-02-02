import { enum_purchase_order_doc_status } from '@repo/prisma-shared-schema-tenant';

// PR Detail linkage interface - links PO detail to PR detail
export interface IPurchaseOrderPrDetail {
  pr_detail_id: string;
  order_qty: number;
  order_unit_id: string;
  order_unit_name?: string;
  order_base_qty: number;
  order_base_unit_id?: string;
  order_base_unit_name?: string;
}

export interface IPurchaseOrderDetail {
  id?: string;
  description?: string;
  is_active?: boolean;
  sequence_no?: number;

  // Product info (stored in info JSON since not in schema)
  product_id?: string;
  product_name?: string;
  product_local_name?: string;

  purchase_order_id?: string;
  order_qty?: number;
  order_unit_id?: string;
  order_unit_name?: string;
  order_unit_conversion_factor?: number;
  base_qty?: number;
  base_unit_id?: string;
  base_unit_name?: string;

  // Pricing
  price?: number;
  sub_total_price?: number;
  base_sub_total_price?: number;
  net_amount?: number;
  base_net_amount?: number;
  total_price?: number;
  base_total_price?: number;

  // FOC
  is_foc?: boolean;

  // Tax
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  base_tax_amount?: number;
  is_tax_adjustment?: boolean;

  // Discount
  discount_rate?: number;
  discount_amount?: number;
  base_discount_amount?: number;
  is_discount_adjustment?: boolean;

  received_qty?: number;
  cancelled_qty?: number;

  history?: object;
  note?: string;
  info?: object;
  dimension?: object;

  // PR detail linkage
  pr_detail?: IPurchaseOrderPrDetail[];
}

export interface IPurchaseOrder {
  id?: string;
  po_no?: string;
  po_status?: enum_purchase_order_doc_status;

  description?: string;
  order_date?: Date | string;
  delivery_date?: Date | string;

  // Workflow
  workflow_id?: string;
  workflow_name?: string;
  workflow_history?: object;
  workflow_current_stage?: string;
  workflow_previous_stage?: string;
  workflow_next_stage?: string;
  user_action?: object;
  last_action?: string;
  last_action_at_date?: Date | string;
  last_action_by_id?: string;
  last_action_by_name?: string;

  // Vendor
  vendor_id?: string;
  vendor_name?: string;

  // Currency
  currency_id?: string;
  currency_name?: string;
  exchange_rate?: number;

  approval_date?: Date | string;
  email?: string;

  // Buyer
  buyer_id?: string;
  buyer_name?: string;

  // Credit Term
  credit_term_id?: string;
  credit_term_name?: string;
  credit_term_value?: number;

  remarks?: string;
  history?: object;

  // Totals
  total_qty?: number;
  total_price?: number;
  total_tax?: number;
  total_amount?: number;

  is_active?: boolean;
  doc_version?: number;

  note?: string;
  info?: object;
  dimension?: object;
}

export interface ICreatePurchaseOrder {
  vendor_id: string;
  vendor_name?: string;
  delivery_date: string;
  currency_id: string;
  currency_name?: string;
  exchange_rate?: number;
  description?: string;
  order_date?: string;
  credit_term_id?: string;
  credit_term_name?: string;
  credit_term_value?: number;
  buyer_id?: string;
  buyer_name?: string;
  email?: string;
  remarks?: string;
  note?: string;
  details: ICreatePurchaseOrderDetail[];
}

export interface ICreatePurchaseOrderDetail {
  sequence: number;
  product_id: string;
  product_name?: string;
  product_local_name?: string;
  order_unit_id: string;
  order_unit_name?: string;
  order_unit_conversion_factor?: number;
  order_qty: number;
  base_unit_id?: string;
  base_unit_name?: string;
  base_qty?: number;
  // Pricing
  price?: number;
  sub_total_price?: number;
  net_amount?: number;
  total_price?: number;
  // Tax
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  is_tax_adjustment?: boolean;
  // Discount
  discount_rate?: number;
  discount_amount?: number;
  is_discount_adjustment?: boolean;
  // FOC
  is_foc?: boolean;
  // PR detail linkage
  pr_detail: IPurchaseOrderPrDetail[];
  description?: string;
  note?: string;
}

export interface IUpdatePurchaseOrder extends Partial<IPurchaseOrder> {
  id: string;
  po_status?: enum_purchase_order_doc_status;
  doc_version: number;
  purchase_order_details?: {
    add?: Omit<IPurchaseOrderDetail, 'id' | 'purchase_order_id'>[];
    update?: IPurchaseOrderDetail[];
    remove?: { id: string }[];
  };
}

export interface IUpdatePurchaseOrderDetail
  extends Partial<IPurchaseOrderDetail> {
  purchase_order_detail?: {
    add?: Omit<IPurchaseOrderDetail, 'id' | 'purchase_order_id'>[];
    update?: IPurchaseOrderDetail;
    remove?: { id: string }[];
  };
}
