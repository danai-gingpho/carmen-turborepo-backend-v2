import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseOrderLocationDto {
  @ApiProperty({ description: 'Location ID', format: 'uuid' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name' })
  location_name?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID', format: 'uuid' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point name' })
  delivery_point_name?: string;

  @ApiProperty({ description: 'Order quantity for this location' })
  order_qty: number;

  @ApiPropertyOptional({ description: 'Order base quantity for this location' })
  order_base_qty?: number;
}

export class PurchaseOrderPrDetailDto {
  @ApiProperty({ description: 'PR Detail ID', format: 'uuid' })
  pr_detail_id: string;

  @ApiProperty({ description: 'Order quantity for this PR detail' })
  order_qty: number;

  @ApiProperty({ description: 'Order unit ID', format: 'uuid' })
  order_unit_id: string;

  @ApiPropertyOptional({ description: 'Order unit name' })
  order_unit_name?: string;

  @ApiProperty({ description: 'Order base quantity (calculated: order_qty * conversion_factor)' })
  order_base_qty: number;

  @ApiPropertyOptional({ description: 'Order base unit ID', format: 'uuid' })
  order_base_unit_id?: string;

  @ApiPropertyOptional({ description: 'Order base unit name' })
  order_base_unit_name?: string;
}

export class PurchaseOrderDetailDto {
  @ApiPropertyOptional({ description: 'Name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product ID', format: 'uuid' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product code' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  product_sku?: string;

  @ApiPropertyOptional({ description: 'Exchange rate' })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Order quantity' })
  order_qty?: number;

  @ApiPropertyOptional({ description: 'Order unit ID', format: 'uuid' })
  order_unit_id?: string;

  @ApiPropertyOptional({ description: 'Base quantity' })
  base_qty?: number;

  @ApiPropertyOptional({ description: 'Base unit ID', format: 'uuid' })
  base_unit_id?: string;

  @ApiPropertyOptional({ description: 'Unit price' })
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Sub total price' })
  sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Base sub total price' })
  base_sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Is FOC (Free of Charge)' })
  is_foc?: boolean;

  @ApiPropertyOptional({ description: 'Is tax included' })
  is_tax_included?: boolean;

  @ApiPropertyOptional({ description: 'Tax rate' })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Discount rate' })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Net amount' })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Base net amount' })
  base_net_amount?: number;

  @ApiPropertyOptional({ description: 'Total price' })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Base total price' })
  base_total_price?: number;

  @ApiPropertyOptional({ description: 'Additional info (JSON)' })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Change history (JSON)' })
  history?: unknown;

  @ApiProperty({ description: 'Location breakdown for this line item', type: [PurchaseOrderLocationDto] })
  locations: PurchaseOrderLocationDto[];
}

export class CreatePurchaseOrderDetailOperationsDto {
  @ApiProperty({
    description: 'Detail line items to add',
    type: [PurchaseOrderDetailDto],
  })
  add: PurchaseOrderDetailDto[];
}

export class CreatePurchaseOrderDetailsDto {
  @ApiPropertyOptional({ description: 'Purchase order type', enum: ['manual', 'purchase_request'], default: 'manual', example: 'manual' })
  po_type?: string;

  @ApiProperty({ description: 'Vendor ID', format: 'uuid' })
  vendor_id: string;

  @ApiPropertyOptional({ description: 'Vendor name' })
  vendor_name?: string;

  @ApiProperty({ description: 'Delivery date (ISO 8601)' })
  delivery_date: string;

  @ApiProperty({ description: 'Currency ID', format: 'uuid' })
  currency_id: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', default: 1 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Order date (ISO 8601)' })
  order_date?: string;

  @ApiPropertyOptional({ description: 'Credit term ID', format: 'uuid' })
  credit_term_id?: string;

  @ApiPropertyOptional({ description: 'Credit term name' })
  credit_term_name?: string;

  @ApiPropertyOptional({ description: 'Credit term value (days)' })
  credit_term_value?: number;

  @ApiPropertyOptional({ description: 'Buyer ID', format: 'uuid' })
  buyer_id?: string;

  @ApiPropertyOptional({ description: 'Buyer name' })
  buyer_name?: string;

  @ApiPropertyOptional({ description: 'Email address', format: 'email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  remarks?: string;

  @ApiPropertyOptional({ description: 'Note' })
  note?: string;

  @ApiProperty({ description: 'Workflow ID', format: 'uuid' })
  workflow_id: string;

  @ApiProperty({
    description: 'Purchase order detail operations (add line items)',
    type: CreatePurchaseOrderDetailOperationsDto,
  })
  purchase_order_detail: CreatePurchaseOrderDetailOperationsDto;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Stage role', enum: ['create'], default: 'create' })
  stage_role: string;

  @ApiProperty({ description: 'Purchase order data', type: CreatePurchaseOrderDetailsDto })
  details: CreatePurchaseOrderDetailsDto;
}
