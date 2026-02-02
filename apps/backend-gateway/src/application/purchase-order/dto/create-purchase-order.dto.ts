import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ description: 'Sequence number', example: 1 })
  sequence: number;

  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name' })
  product_local_name?: string;

  @ApiProperty({ description: 'Order unit ID', format: 'uuid' })
  order_unit_id: string;

  @ApiPropertyOptional({ description: 'Order unit name' })
  order_unit_name?: string;

  @ApiPropertyOptional({ description: 'Order unit conversion factor', default: 1 })
  order_unit_conversion_factor?: number;

  @ApiProperty({ description: 'Order quantity' })
  order_qty: number;

  @ApiPropertyOptional({ description: 'Base unit ID', format: 'uuid' })
  base_unit_id?: string;

  @ApiPropertyOptional({ description: 'Base unit name' })
  base_unit_name?: string;

  @ApiPropertyOptional({ description: 'Base quantity' })
  base_qty?: number;

  @ApiPropertyOptional({ description: 'Unit price', default: 0 })
  price?: number;

  @ApiPropertyOptional({ description: 'Sub total price (price * qty)', default: 0 })
  sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Net amount (after discount)', default: 0 })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Total price (net + tax)', default: 0 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Tax profile ID', format: 'uuid' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name' })
  tax_profile_name?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', default: 0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Tax amount', default: 0 })
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Is tax adjustment', default: false })
  is_tax_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Discount rate percentage', default: 0 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Is discount adjustment', default: false })
  is_discount_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Is FOC (Free of Charge)', default: false })
  is_foc?: boolean;

  @ApiProperty({
    description: 'PR Detail linkages - connects this PO detail to PR details',
    type: [PurchaseOrderPrDetailDto],
  })
  pr_detail: PurchaseOrderPrDetailDto[];

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note' })
  note?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Vendor ID', format: 'uuid' })
  vendor_id: string;

  @ApiPropertyOptional({ description: 'Vendor name' })
  vendor_name?: string;

  @ApiProperty({
    description: 'Delivery date',
    example: '2024-01-15T00:00:00Z',
  })
  delivery_date: string;

  @ApiProperty({ description: 'Currency ID', format: 'uuid' })
  currency_id: string;

  @ApiPropertyOptional({ description: 'Currency name' })
  currency_name?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', default: 1 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Order date (defaults to current date)',
    example: '2024-01-10T00:00:00Z',
  })
  order_date?: string;

  @ApiPropertyOptional({ description: 'Credit term ID', format: 'uuid' })
  credit_term_id?: string;

  @ApiPropertyOptional({ description: 'Credit term name' })
  credit_term_name?: string;

  @ApiPropertyOptional({ description: 'Credit term value in days' })
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

  @ApiProperty({
    description: 'Purchase Order details',
    type: [PurchaseOrderDetailDto],
  })
  details: PurchaseOrderDetailDto[];
}
