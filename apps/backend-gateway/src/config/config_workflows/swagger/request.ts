import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowCreateRequestDto {
  @ApiProperty({ description: 'Workflow name', example: 'Purchase Request Approval' })
  name: string;

  @ApiProperty({ description: 'Workflow type', example: 'purchase_request', enum: ['purchase_request', 'purchase_order', 'store_requisition'] })
  workflow_type: string;

  @ApiPropertyOptional({ description: 'Workflow data/configuration (JSON)', example: { steps: [{ role: 'HOD', action: 'approve' }] } })
  data?: unknown;

  @ApiPropertyOptional({ description: 'Whether the workflow is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Workflow description', example: 'Standard purchase request approval flow' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Requires HOD and GM approval for amounts over 50,000' })
  note?: string;
}

export class WorkflowUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Workflow name', example: 'Purchase Request Approval' })
  name?: string;

  @ApiPropertyOptional({ description: 'Workflow type', example: 'purchase_request', enum: ['purchase_request', 'purchase_order', 'store_requisition'] })
  workflow_type?: string;

  @ApiPropertyOptional({ description: 'Workflow data/configuration (JSON)', example: { steps: [{ role: 'HOD', action: 'approve' }] } })
  data?: unknown;

  @ApiPropertyOptional({ description: 'Whether the workflow is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Workflow description', example: 'Standard purchase request approval flow' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Requires HOD and GM approval for amounts over 50,000' })
  note?: string;
}
