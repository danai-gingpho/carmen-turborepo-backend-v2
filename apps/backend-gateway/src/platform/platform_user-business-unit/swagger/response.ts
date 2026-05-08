import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditDto } from '@/common/dto';

export class UserBusinessUnitResponseDto {
  @ApiProperty({ description: 'User-Business Unit mapping ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Business unit ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  business_unit_id?: string;

  @ApiProperty({ description: 'User role in business unit', example: 'user', enum: ['admin', 'user'] })
  role: string;

  @ApiPropertyOptional({ description: 'Is default business unit for the user', example: false })
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Is mapping active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Audit metadata (timestamps + resolved user names)', type: () => AuditDto })
  audit?: AuditDto;
}

export class UserBusinessUnitListResponseDto {
  @ApiProperty({ description: 'List of User Business Unit records', type: [UserBusinessUnitResponseDto] })
  data: UserBusinessUnitResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class UserBusinessUnitMutationResponseDto {
  @ApiProperty({ description: 'User Business Unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
