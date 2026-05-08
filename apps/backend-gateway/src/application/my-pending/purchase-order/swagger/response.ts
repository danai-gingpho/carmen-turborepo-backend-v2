import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MyPendingPurchaseOrderCountResponseDto {
  @ApiProperty({ description: 'Count of pending purchase orders', example: 1 })
  pending: number;
}

export class MyPendingPurchaseOrderResponseDto {
  @ApiProperty({ description: 'Purchase order ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Purchase order number', example: 'PO-2026-001' })
  po_no?: string;

  @ApiPropertyOptional({ description: 'Purchase order date', example: '2026-03-10T00:00:00.000Z' })
  po_date?: Date;

  @ApiPropertyOptional({ description: 'Document status', example: 'pending' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Kitchen supplies order' })
  description?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Suppliers Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Business unit code', example: 'BU-001' })
  bu_code?: string;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Document version number', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Last updated timestamp', example: '2026-03-10T12:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Last updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class MyPendingPurchaseOrderListResponseDto {
  @ApiProperty({ description: 'List of MyPendingPurchaseOrder records', type: [MyPendingPurchaseOrderResponseDto] })
  data: MyPendingPurchaseOrderResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
