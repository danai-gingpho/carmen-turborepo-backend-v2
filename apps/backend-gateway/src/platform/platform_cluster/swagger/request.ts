import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClusterCreateRequestDto {
  @ApiProperty({ description: 'Cluster code (min 3 characters)', example: 'CLU001' })
  code: string;

  @ApiProperty({ description: 'Cluster name (min 3 characters)', example: 'Main Cluster' })
  name: string;

  @ApiPropertyOptional({ description: 'Alias name (max 3 characters)', example: 'MC' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Logo URL', example: 'https://example.com/logo.png' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Maximum number of licensed business units', example: 5 })
  max_license_bu?: number;

  @ApiProperty({ description: 'Is cluster active', example: true })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;
}

export class ClusterUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Cluster code (min 3 characters)', example: 'CLU001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Cluster name (min 3 characters)', example: 'Main Cluster' })
  name?: string;

  @ApiPropertyOptional({ description: 'Alias name (max 3 characters)', example: 'MC' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Logo URL', example: 'https://example.com/logo.png' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Maximum number of licensed business units', example: 5 })
  max_license_bu?: number;

  @ApiPropertyOptional({ description: 'Is cluster active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;
}
