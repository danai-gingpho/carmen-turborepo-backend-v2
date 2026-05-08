import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditDto } from '@/common/dto';

export class ClusterResponseDto {
  @ApiProperty({ description: 'Cluster ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Cluster code', example: 'CLU001' })
  code: string;

  @ApiProperty({ description: 'Cluster name', example: 'Main Cluster' })
  name: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'MC' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Logo URL', example: 'https://example.com/logo.png' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Maximum number of licensed business units', example: 5 })
  max_license_bu?: number;

  @ApiPropertyOptional({ description: 'Is cluster active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Audit metadata (timestamps + resolved user names)', type: () => AuditDto })
  audit?: AuditDto;
}

export class ClusterListResponseDto {
  @ApiProperty({ description: 'List of Cluster records', type: [ClusterResponseDto] })
  data: ClusterResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class ClusterMutationResponseDto {
  @ApiProperty({ description: 'Cluster ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
