import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryTransactionResponseDto {
  @ApiProperty({ description: 'Inventory transaction ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Transaction type', example: 'good_received_note' })
  transaction_type?: string;

  @ApiPropertyOptional({ description: 'Transaction date', example: '2026-03-10T00:00:00.000Z' })
  transaction_date?: Date;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Rice 5kg' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Warehouse' })
  location_name?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 30 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Unit name', example: 'kg' })
  unit_name?: string;

  @ApiPropertyOptional({ description: 'Reference ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  reference_id?: string;

  @ApiPropertyOptional({ description: 'Reference type', example: 'good_received_note' })
  reference_type?: string;

  @ApiPropertyOptional({ description: 'Reference number', example: 'GRN-2026-001' })
  reference_no?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Transaction created from GRN approval' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Whether the transaction is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

/**
 * Mutation response only returns the ID per the Zod serializer schema.
 */
export class InventoryTransactionMutationResponseDto {
  @ApiProperty({ description: 'Inventory transaction ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class InventoryTransactionListResponseDto {
  @ApiProperty({ description: 'List of Inventory Transaction records', type: [InventoryTransactionResponseDto] })
  data: InventoryTransactionResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
