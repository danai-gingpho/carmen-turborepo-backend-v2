import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MyPendingPurchaseRequestCountResponseDto {
  @ApiProperty({ description: 'Count of pending purchase requests', example: 1 })
  pending: number;
}

export class MyPendingPurchaseRequestResponseDto {
  @ApiProperty({ description: 'Purchase request ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Purchase request number', example: 'PR-2026-001' })
  pr_no?: string;

  @ApiPropertyOptional({ description: 'Purchase request date', example: '2026-03-10T00:00:00.000Z' })
  pr_date?: Date;

  @ApiPropertyOptional({ description: 'Document status', example: 'pending' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Monthly kitchen supplies request' })
  description?: string;

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

export class MyPendingPurchaseRequestListResponseDto {
  @ApiProperty({ description: 'List of MyPendingPurchaseRequest records', type: [MyPendingPurchaseRequestResponseDto] })
  data: MyPendingPurchaseRequestResponseDto[];

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
