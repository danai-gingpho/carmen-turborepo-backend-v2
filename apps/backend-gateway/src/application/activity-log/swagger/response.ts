import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { enum_activity_action } from '@repo/prisma-shared-schema-tenant';

export class ActivityLogResponseDto {
  @ApiProperty({ description: 'Activity log ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({
    description: 'Action performed',
    enum: Object.values(enum_activity_action),
    example: 'create',
  })
  action?: string;

  @ApiPropertyOptional({ description: 'Entity type', example: 'purchase_request' })
  entity_type?: string;

  @ApiPropertyOptional({ description: 'Entity ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  entity_id?: string;

  @ApiPropertyOptional({ description: 'Actor (user) ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  actor_id?: string;

  @ApiPropertyOptional({ description: 'Actor username', example: 'john.doe' })
  actor_username?: string;

  @ApiPropertyOptional({ description: 'Actor first name', example: 'John' })
  actor_firstname?: string;

  @ApiPropertyOptional({ description: 'Actor middle name', example: 'M.' })
  actor_middlename?: string;

  @ApiPropertyOptional({ description: 'Actor last name', example: 'Doe' })
  actor_lastname?: string;

  @ApiPropertyOptional({ description: 'Metadata (JSON)', example: {} })
  meta_data?: unknown;

  @ApiPropertyOptional({ description: 'Previous data before change (JSON)', example: {} })
  old_data?: unknown;

  @ApiPropertyOptional({ description: 'New data after change (JSON)', example: {} })
  new_data?: unknown;

  @ApiPropertyOptional({ description: 'IP address of the actor', example: '192.168.1.1' })
  ip_address?: string;

  @ApiPropertyOptional({ description: 'User agent string', example: 'Mozilla/5.0' })
  user_agent?: string;

  @ApiPropertyOptional({ description: 'Description of the activity', example: 'Created purchase request PR-001' })
  description?: string;

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

export class ActivityLogListResponseDto {
  @ApiProperty({ description: 'List of Activity Log records', type: [ActivityLogResponseDto] })
  data: ActivityLogResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
