import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MyPendingStoreRequisitionCountResponseDto {
  @ApiProperty({ description: 'Count of pending store requisitions', example: 1 })
  pending: number;
}

export class MyPendingStoreRequisitionResponseDto {
  @ApiProperty({ description: 'Store requisition ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Store requisition number', example: 'SR-2026-001' })
  sr_no?: string;

  @ApiPropertyOptional({ description: 'Store requisition date', example: '2026-03-10T00:00:00.000Z' })
  sr_date?: Date;

  @ApiPropertyOptional({ description: 'Expected delivery date', example: '2026-03-15T00:00:00.000Z' })
  expected_date?: Date;

  @ApiPropertyOptional({ description: 'Document status', example: 'pending' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Weekly kitchen supplies requisition' })
  description?: string;

  @ApiPropertyOptional({ description: 'From location name', example: 'Main Store' })
  from_location_name?: string;

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

export class MyPendingStoreRequisitionListResponseDto {
  @ApiProperty({ description: 'List of MyPendingStoreRequisition records', type: [MyPendingStoreRequisitionResponseDto] })
  data: MyPendingStoreRequisitionResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class WorkflowStageResponseDto {
  @ApiPropertyOptional({ description: 'Stage name', example: 'HOD Approval' })
  name?: string;

  @ApiPropertyOptional({ description: 'Stage role', example: 'approve' })
  stage_role?: string;

  @ApiPropertyOptional({ description: 'Stage order', example: 1 })
  order?: number;
}
