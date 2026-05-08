import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditNoteDetailItemSwaggerDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Rice 5kg' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'ข้าวสาร 5 กก.' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Inventory transaction ID (source GRN lot)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_transaction_id?: string;

  @ApiPropertyOptional({ description: 'Description of the line item', example: 'Damaged item return' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note for the line item', example: 'Item was damaged on delivery' })
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
}

export class UpdateCreditNoteDetailItemSwaggerDto extends CreditNoteDetailItemSwaggerDto {
  @ApiProperty({ description: 'Credit note detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Credit note ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  credit_note_id: string;
}

export class DeleteCreditNoteDetailItemSwaggerDto {
  @ApiProperty({ description: 'Credit note detail ID to delete', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class CreateCreditNoteDetailSwaggerDto {
  @ApiPropertyOptional({ description: 'Detail items to add', type: [CreditNoteDetailItemSwaggerDto] })
  add?: CreditNoteDetailItemSwaggerDto[];
}

export class UpdateCreditNoteDetailSwaggerDto {
  @ApiPropertyOptional({ description: 'Detail items to add', type: [CreditNoteDetailItemSwaggerDto] })
  add?: CreditNoteDetailItemSwaggerDto[];

  @ApiPropertyOptional({ description: 'Detail items to update', type: [UpdateCreditNoteDetailItemSwaggerDto] })
  update?: UpdateCreditNoteDetailItemSwaggerDto[];

  @ApiPropertyOptional({ description: 'Detail items to delete', type: [DeleteCreditNoteDetailItemSwaggerDto] })
  delete?: DeleteCreditNoteDetailItemSwaggerDto[];
}

export class CreateCreditNoteRequestDto {
  @ApiProperty({ description: 'Credit note type', enum: ['quantity_return', 'amount_discount'], example: 'quantity_return' })
  credit_note_type: string;

  @ApiPropertyOptional({ description: 'Credit note date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  cn_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Credit note for damaged goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Items returned to vendor' })
  note?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  exchange_rate_date?: string;

  @ApiPropertyOptional({ description: 'GRN ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  grn_id?: string;

  @ApiPropertyOptional({ description: 'Credit note reason ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cn_reason_id?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Credit note detail line items', type: CreateCreditNoteDetailSwaggerDto })
  credit_note_detail?: CreateCreditNoteDetailSwaggerDto;
}

export class UpdateCreditNoteRequestDto {
  @ApiPropertyOptional({ description: 'Credit note ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ description: 'Credit note type', enum: ['quantity_return', 'amount_discount'], example: 'quantity_return' })
  credit_note_type?: string;

  @ApiPropertyOptional({ description: 'Credit note date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  cn_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Credit note for damaged goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Items returned to vendor' })
  note?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  exchange_rate_date?: string;

  @ApiPropertyOptional({ description: 'GRN ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  grn_id?: string;

  @ApiPropertyOptional({ description: 'Credit note reason ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cn_reason_id?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Credit note detail operations (add, update, delete)', type: UpdateCreditNoteDetailSwaggerDto })
  credit_note_detail?: UpdateCreditNoteDetailSwaggerDto;
}
