import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveByStageRoleRequestDto {
  @ApiProperty({ description: 'Detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Approved with quantity adjustment' })
  description?: string;

  @ApiProperty({ description: 'Purchase request ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  purchase_reuqest_id: string;

  @ApiProperty({ description: 'Stage status', example: 'approved' })
  stage_status: string;

  @ApiPropertyOptional({ description: 'Stage message / reason', example: 'Approved as requested' })
  stage_message?: string;

  @ApiProperty({ description: 'Stage role (approve or purchase)', example: 'approve' })
  stage_role: string;
}

export class ReviewPurchaseRequestRequestDto {
  @ApiPropertyOptional({ description: 'Review notes or comments', example: 'Please check the quantities.' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Review status', example: 'reviewed' })
  status?: string;
}
