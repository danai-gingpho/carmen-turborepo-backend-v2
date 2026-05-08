import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditNoteDetailResponseDto {
  @ApiProperty({ description: 'Credit note detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Parent credit note ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  credit_note_id: string;

  @ApiPropertyOptional({ description: 'Inventory transaction ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_transaction_id?: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Damaged item return' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Item was damaged on delivery' })
  note?: string;

  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'LOC-001' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Warehouse' })
  location_name?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point name', example: 'Kitchen Receiving' })
  delivery_point_name?: string;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Rice 5kg' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'ข้าวสาร 5 กก.' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Return quantity', example: 5 })
  return_qty?: number;

  @ApiPropertyOptional({ description: 'Return unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  return_unit_id?: string;

  @ApiPropertyOptional({ description: 'Return unit name', example: 'KG' })
  return_unit_name?: string;

  @ApiPropertyOptional({ description: 'Return unit conversion factor', example: 1 })
  return_conversion_factor?: number;

  @ApiPropertyOptional({ description: 'Return base quantity', example: 5 })
  return_base_qty?: number;

  @ApiPropertyOptional({ description: 'Price per unit', example: 25.5 })
  price?: number;

  @ApiPropertyOptional({ description: 'Tax profile ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  tax_profile_name?: string;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7.0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 8.93 })
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Base tax amount', example: 8.93 })
  base_tax_amount?: number;

  @ApiPropertyOptional({ description: 'Whether tax amount is manually adjusted', example: false })
  is_tax_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Discount rate', example: 0 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 0 })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Base discount amount', example: 0 })
  base_discount_amount?: number;

  @ApiPropertyOptional({ description: 'Whether discount amount is manually adjusted', example: false })
  is_discount_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Extra cost amount', example: 0 })
  extra_cost_amount?: number;

  @ApiPropertyOptional({ description: 'Base extra cost amount', example: 0 })
  base_extra_cost_amount?: number;

  @ApiPropertyOptional({ description: 'Subtotal price before tax and discount', example: 127.5 })
  sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Net amount after discount before tax', example: 127.5 })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Total price including tax and discount', example: 136.43 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Base price (in base currency)', example: 25.5 })
  base_price?: number;

  @ApiPropertyOptional({ description: 'Base subtotal price', example: 127.5 })
  base_sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Base net amount', example: 127.5 })
  base_net_amount?: number;

  @ApiPropertyOptional({ description: 'Base total price', example: 136.43 })
  base_total_price?: number;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: string;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class CreditNoteResponseDto {
  @ApiProperty({ description: 'Credit note ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Credit note number', example: 'CN-2026-001' })
  cn_no?: string;

  @ApiPropertyOptional({ description: 'Credit note date', example: '2026-03-10T00:00:00.000Z' })
  cn_date?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Credit note type', enum: ['quantity_return', 'amount_discount'], example: 'quantity_return' })
  credit_note_type?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Pricelist detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pricelist_detail_id?: string;

  @ApiPropertyOptional({ description: 'Pricelist number', example: 'PL-2026-001' })
  pricelist_no?: string;

  @ApiPropertyOptional({ description: 'Pricelist unit', example: 'KG' })
  pricelist_unit?: string;

  @ApiPropertyOptional({ description: 'Pricelist price', example: 25.5 })
  pricelist_price?: number;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate date', example: '2026-03-10T00:00:00.000Z' })
  exchange_rate_date?: string;

  @ApiPropertyOptional({ description: 'GRN ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  grn_id?: string;

  @ApiPropertyOptional({ description: 'GRN number', example: 'GRN-2026-001' })
  grn_no?: string;

  @ApiPropertyOptional({ description: 'GRN date', example: '2026-03-09T00:00:00.000Z' })
  grn_date?: string;

  @ApiPropertyOptional({ description: 'Credit note reason ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cn_reason_id?: string;

  @ApiPropertyOptional({ description: 'Credit note reason name', example: 'Damaged Goods' })
  cn_reason_name?: string;

  @ApiPropertyOptional({ description: 'Credit note reason description', example: 'Items damaged during transit' })
  cn_reason_description?: string;

  @ApiPropertyOptional({ description: 'Invoice number', example: 'INV-2026-001' })
  invoice_no?: string;

  @ApiPropertyOptional({ description: 'Invoice date', example: '2026-03-08T00:00:00.000Z' })
  invoice_date?: string;

  @ApiPropertyOptional({ description: 'Tax invoice number', example: 'TINV-2026-001' })
  tax_invoice_no?: string;

  @ApiPropertyOptional({ description: 'Tax invoice date', example: '2026-03-08T00:00:00.000Z' })
  tax_invoice_date?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Items returned to vendor' })
  note?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Credit note for damaged goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: string;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Credit note detail line items', type: [CreditNoteDetailResponseDto] })
  credit_note_detail?: CreditNoteDetailResponseDto[];
}

export class CreditNoteListResponseDto {
  @ApiProperty({ description: 'List of credit notes', type: [CreditNoteResponseDto] })
  data: CreditNoteResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class CreditNoteMutationResponseDto {
  @ApiProperty({ description: 'Credit note ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Credit note number', example: 'CN-2026-001' })
  cn_no?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;
}
