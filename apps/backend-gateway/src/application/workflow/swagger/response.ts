import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Workflow name', example: 'Purchase Request Approval' })
  name: string;

  @ApiPropertyOptional({ description: 'Workflow type', example: 'purchase_request' })
  workflow_type?: string;

  @ApiPropertyOptional({ description: 'Workflow data/stages (JSON)', example: {} })
  data?: unknown;

  @ApiPropertyOptional({ description: 'Whether the workflow is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Description', example: 'Standard 3-step approval workflow' })
  description?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Used by all departments' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;
}

export class WorkflowListResponseDto {
  @ApiProperty({ description: 'List of workflow records', type: [WorkflowResponseDto] })
  data: WorkflowResponseDto[];

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
