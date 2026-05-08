import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditDto } from '@/common/dto';

export class BusinessUnitResponseDto {
  @ApiProperty({ description: 'Business unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Cluster ID the business unit belongs to', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  cluster_id: string;

  @ApiProperty({ description: 'Business unit code', example: 'BU001' })
  code: string;

  @ApiProperty({ description: 'Business unit name', example: 'Grand Palace Hotel' })
  name: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'GPH' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Default currency ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  default_currency_id?: string;

  @ApiPropertyOptional({ description: 'Whether this is the headquarters unit', example: false })
  is_hq?: boolean;

  @ApiPropertyOptional({ description: 'Whether the business unit is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Audit metadata (timestamps + resolved user names)', type: () => AuditDto })
  audit?: AuditDto;
}

export class BusinessUnitListResponseDto {
  @ApiProperty({ description: 'List of Business Unit records', type: [BusinessUnitResponseDto] })
  data: BusinessUnitResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class BusinessUnitMutationResponseDto {
  @ApiProperty({ description: 'Business Unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
