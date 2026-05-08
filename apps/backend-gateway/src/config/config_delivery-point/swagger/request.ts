import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryPointCreateRequest {
  @ApiProperty({ description: 'Name of the delivery point', example: 'Main Warehouse Dock' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the delivery point', example: 'Primary receiving dock for goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the delivery point is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Open 8am-5pm weekdays' })
  note?: string;
}

export class DeliveryPointUpdateRequest {
  @ApiPropertyOptional({ description: 'Name of the delivery point', example: 'Main Warehouse Dock' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the delivery point', example: 'Primary receiving dock for goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the delivery point is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Open 8am-5pm weekdays' })
  note?: string;
}
