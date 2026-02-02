import { enum_good_received_note_status, enum_good_received_note_type, enum_allocate_extra_cost_type } from '@repo/prisma-shared-schema-tenant';

export interface IGoodReceivedNoteDetailCreate {
  inventory_transaction_id?: string;
  good_received_note_id?: string;

  purchase_order_detail_id?: string;
  sequence_no: number;

  location_id: string;
  location_name?: string;

  product_id: string;
  product_name?: string;
  product_local_name?: string;

  order_qty?: number;
  order_unit_id: string;
  order_unit_name?: string;

  received_qty?: number;
  received_unit_id: string;
  received_unit_name?: string;

  is_foc?: boolean;
  foc_qty?: number;
  foc_unit_id?: string;
  foc_unit_name?: string;

  price?: number;

  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  is_tax_adjustment?: boolean;
  total_amount?: number;

  delivery_point_id?: string;
  delivery_point_name?: string;

  base_price?: number;
  base_qty?: number;
  extra_cost?: number;
  total_cost?: number;

  is_discount?: boolean;
  discount_rate?: number;
  discount_amount?: number;
  is_discount_adjustment?: boolean;

  expired_date?: string;
  note?: string;
  info?: object;
  dimension?: object;
}

export interface IExtraCostDetailCreate {
  extra_cost_id?: string;

  extra_cost_type_id: string;
  extra_cost_type_name?: string;

  amount?: number;
  is_tax?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  is_tax_adjustment?: boolean;
  note?: string;
  info?: object;
  dimension?: object;
}

export interface IGoodReceivedNoteCreate {
  name?: string;
  grn_no?: string;
  grn_date?: string;
  invoice_no?: string;
  invoice_date?: string;
  description?: string;
  doc_status?: enum_good_received_note_status;
  doc_type?: enum_good_received_note_type;

  vendor_id?: string;
  vendor_name?: string;

  currency_id: string;
  currency_name?: string;
  currency_rate?: number;

  // workflow_id?: string;
  // workflow_obj?: object;
  // workflow_history?: object;
  // current_workflow_status?: string;

  is_consignment?: boolean;
  is_cash?: boolean;
  signature_image_url?: string;

  received_by_id?: string;
  received_by_name?: string;
  received_at?: string;

  credit_term_id?: string;
  credit_term_name?: string;
  credit_term_days?: number;
  payment_due_date?: string;

  is_active?: boolean;
  note?: string;
  info?: object;
  dimension?: object;

  good_received_note_detail?: {
    add?: IGoodReceivedNoteDetailCreate[];
  };

  extra_cost?: {
    name?: string;
    allocate_extracost_type?: enum_allocate_extra_cost_type;
    note?: string;
    info?: object;
    extra_cost_detail?: {
      add?: IExtraCostDetailCreate[];
    };
  };
}

export interface IGoodReceivedNoteDetailUpdate {
  id: string;
  inventory_transaction_id?: string;
  good_received_note_id?: string;

  purchase_order_detail_id?: string;
  sequence_no?: number;

  location_id?: string;
  location_name?: string;

  product_id?: string;
  product_name?: string;
  product_local_name?: string;

  order_qty?: number;
  order_unit_id?: string;
  order_unit_name?: string;

  received_qty?: number;
  received_unit_id?: string;
  received_unit_name?: string;

  is_foc?: boolean;
  foc_qty?: number;
  foc_unit_id?: string;
  foc_unit_name?: string;

  price?: number;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  is_tax_adjustment?: boolean;
  total_amount?: number;

  delivery_point_id?: string;
  delivery_point_name?: string;

  base_price?: number;
  base_qty?: number;
  extra_cost?: number;
  total_cost?: number;

  is_discount?: boolean;
  discount_rate?: number;
  discount_amount?: number;
  is_discount_adjustment?: boolean;

  expired_date?: string;
  note?: string;
  info?: object;
  dimension?: object;
}

export interface IExtraCostDetailUpdate {
  id: string;
  extra_cost_type_id?: string;
  extra_cost_type_name?: string;
  amount?: number;
  is_tax?: boolean;
  tax_profile_id?: string;
  tax_profile_name?: string;
  tax_rate?: number;
  tax_amount?: number;
  is_tax_adjustment?: boolean;
  note?: string;
  info?: object;
  dimension?: object;
}

export interface IGoodReceivedNoteUpdate {
  id: string;
  name?: string;
  grn_no?: string;
  invoice_no?: string;
  invoice_date?: string;
  description?: string;
  doc_status?: enum_good_received_note_status;
  doc_type?: enum_good_received_note_type;

  vendor_id?: string;
  vendor_name?: string;

  currency_id?: string;
  currency_name?: string;
  currency_rate?: number;

  // workflow_id?: string;
  // workflow_object?: any;
  // workflow_history?: any;
  // current_workflow_status?: string;

  is_consignment?: boolean;
  is_cash?: boolean;
  signature_image_url?: string;

  received_by_id?: string;
  received_by_name?: string;
  received_at?: string;

  credit_term_id?: string;
  credit_term_name?: string;
  credit_term_days?: number;
  payment_due_date?: string;

  is_active?: boolean;
  note?: string;
  info?: object;
  dimension?: object;

  good_received_note_detail?: {
    add?: IGoodReceivedNoteDetailCreate[];
    update?: IGoodReceivedNoteDetailUpdate[];
    remove?: { id: string }[];
  };

  extra_cost?: {
    id?: string;
    name?: string;
    allocate_extracost_type?: enum_allocate_extra_cost_type;
    note?: string;
    info?: object;
    extra_cost_detail?: {
      add?: IExtraCostDetailCreate[];
      update?: IExtraCostDetailUpdate[];
      remove?: { id: string }[];
    };
  };
}
