import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestCreateFromGrnDetailItemDto {
  @ApiProperty({ description: 'GRN detail item ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  detail_item_id: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Received base quantity', example: 30 })
  received_base_qty: number;

  @ApiProperty({ description: 'Base net amount', example: 100 })
  base_net_amount: number;
}

export class TestCreateFromGrnRequestDto {
  @ApiProperty({ description: 'GRN ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  grn_id: string;

  @ApiProperty({ description: 'GRN number', example: 'GRN-2026-001' })
  grn_no: string;

  @ApiProperty({ description: 'GRN date', example: '2026-02-25T00:00:00.000Z' })
  grn_date: string;

  @ApiProperty({ description: 'Detail items for the transaction', type: [TestCreateFromGrnDetailItemDto] })
  detail_items: TestCreateFromGrnDetailItemDto[];
}

export class TestIssueRequestDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Quantity to issue', example: 10 })
  qty: number;
}

export class TestAdjustmentInRequestDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Quantity to add', example: 5 })
  qty: number;

  @ApiProperty({ description: 'Cost per unit', example: 10.5 })
  cost_per_unit: number;
}

export class TestAdjustmentOutRequestDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Quantity to remove', example: 3 })
  qty: number;
}

export class TestTransferRequestDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 5 })
  qty: number;

  @ApiProperty({ description: 'Source location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  from_location_id: string;

  @ApiPropertyOptional({ description: 'Source location code', example: 'WH-01' })
  from_location_code?: string;

  @ApiProperty({ description: 'Destination location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567891' })
  to_location_id: string;

  @ApiPropertyOptional({ description: 'Destination location code', example: 'WH-02' })
  to_location_code?: string;
}

export class TestEopInRequestDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Quantity to increase', example: 5 })
  qty: number;

  @ApiProperty({ description: 'Cost per unit', example: 10.5 })
  cost_per_unit: number;
}

export class TestEopOutRequestDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Quantity to decrease', example: 3 })
  qty: number;
}

export class TestCreditNoteQtyDetailItemDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Quantity', example: 10 })
  qty: number;

  @ApiProperty({ description: 'Cost per unit', example: 100 })
  cost_per_unit: number;
}

export class TestCreditNoteQtyRequestDto {
  @ApiProperty({ description: 'GRN ID that originated the lots', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  grn_id: string;

  @ApiProperty({ description: 'Detail items for the credit note', type: [TestCreditNoteQtyDetailItemDto] })
  detail_items: TestCreditNoteQtyDetailItemDto[];
}

export class TestCreditNoteAmountDetailItemDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'WH-01' })
  location_code?: string;

  @ApiProperty({ description: 'Credit note amount', example: 10 })
  amount: number;
}

export class TestCreditNoteAmountRequestDto {
  @ApiProperty({ description: 'GRN ID that originated the lots', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  grn_id: string;

  @ApiProperty({ description: 'Detail items for the credit note amount adjustment', type: [TestCreditNoteAmountDetailItemDto] })
  detail_items: TestCreditNoteAmountDetailItemDto[];
}

export class ClearProductTransactionsRequestDto {
  @ApiProperty({ description: 'Product ID to clear transactions for', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;
}
