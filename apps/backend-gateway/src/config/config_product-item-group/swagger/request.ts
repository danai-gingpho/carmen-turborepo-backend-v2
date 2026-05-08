import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductItemGroupCreateRequest {
  @ApiProperty({ description: 'Item group name', example: 'Dry Goods' })
  name: string;

  @ApiPropertyOptional({ description: 'Item group description', example: 'Non-perishable dry goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the item group is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes rice, flour, pasta' })
  note?: string;
}

export class ProductItemGroupUpdateRequest {
  @ApiPropertyOptional({ description: 'Item group name', example: 'Dry Goods' })
  name?: string;

  @ApiPropertyOptional({ description: 'Item group description', example: 'Non-perishable dry goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the item group is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes rice, flour, pasta' })
  note?: string;
}
