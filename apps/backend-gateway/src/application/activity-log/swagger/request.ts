import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { enum_activity_action } from '@repo/prisma-shared-schema-tenant';

export class ActivityLogFilterDto {
  @ApiPropertyOptional({ description: 'Filter by entity type', example: 'purchase_request' })
  entity_type?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  entity_id?: string;

  @ApiPropertyOptional({ description: 'Filter by actor (user) ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  actor_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by action',
    enum: Object.values(enum_activity_action),
    example: 'create',
  })
  action?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  start_date?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2026-12-31T23:59:59.000Z' })
  end_date?: string;
}

export class BatchDeleteDto {
  @ApiProperty({
    description: 'Array of activity log IDs to delete',
    type: [String],
    example: ['id-1', 'id-2'],
  })
  ids: string[];
}
