import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PlatformUserResponseDto {
  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Username', example: 'john.doe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'JD' })
  alias_name?: string;

  @ApiProperty({
    description: 'Platform role',
    example: 'user',
    enum: ['super_admin', 'platform_admin', 'support_manager', 'support_staff', 'security_officer', 'integration_developer', 'user'],
  })
  platform_role: string;

  @ApiPropertyOptional({ description: 'Is user active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Is user consent given', example: false })
  is_consent?: boolean;

  @ApiPropertyOptional({ description: 'Socket ID for real-time communication', example: 'socket-abc123' })
  socket_id?: string;

  @ApiProperty({ description: 'Is user currently online', example: false })
  is_online: boolean;

  @ApiPropertyOptional({ description: 'Consent timestamp', example: '2026-03-10T00:00:00.000Z' })
  consent_at?: Date;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Deleted timestamp', example: null })
  deleted_at?: Date;
}

export class PlatformUserListResponseDto {
  @ApiProperty({ description: 'List of Platform User records', type: [PlatformUserResponseDto] })
  data: PlatformUserResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PlatformUserMutationResponseDto {
  @ApiProperty({ description: 'Platform User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
