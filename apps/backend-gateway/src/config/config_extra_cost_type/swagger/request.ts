import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtraCostTypeCreateRequest {
  @ApiProperty({ description: 'Name of the extra cost type', example: 'Shipping Fee' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the extra cost type', example: 'Additional shipping charges' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the extra cost type is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Applied to international orders' })
  note?: string;
}

export class ExtraCostTypeUpdateRequest {
  @ApiPropertyOptional({ description: 'Name of the extra cost type', example: 'Shipping Fee' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the extra cost type', example: 'Additional shipping charges' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the extra cost type is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Applied to international orders' })
  note?: string;
}
