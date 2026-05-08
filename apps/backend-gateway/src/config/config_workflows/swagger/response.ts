import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Workflow name', example: 'Purchase Request Approval' })
  name: string;

  @ApiProperty({ description: 'Workflow type', example: 'purchase_request' })
  workflow_type: string;

  @ApiPropertyOptional({ description: 'Workflow data/configuration (JSON)', example: { steps: [{ role: 'HOD', action: 'approve' }] } })
  data?: unknown;

  @ApiPropertyOptional({ description: 'Whether the workflow is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Workflow description', example: 'Standard purchase request approval flow' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Requires HOD and GM approval for amounts over 50,000' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-01-15T10:30:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-01-15T10:30:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class WorkflowListResponseDto {
  @ApiProperty({ description: 'List of Workflow records', type: [WorkflowResponseDto] })
  data: WorkflowResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class WorkflowMutationResponseDto {
  @ApiProperty({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
