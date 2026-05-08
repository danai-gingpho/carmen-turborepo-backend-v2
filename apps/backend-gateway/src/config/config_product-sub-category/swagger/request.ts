import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSubCategoryCreateRequest {
  @ApiProperty({ description: 'Sub-category name', example: 'Fresh Vegetables' })
  name: string;

  @ApiPropertyOptional({ description: 'Sub-category description', example: 'Fresh vegetable produce' })
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Whether the sub-category is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Locally sourced when possible' })
  note?: string;
}

export class ProductSubCategoryUpdateRequest {
  @ApiPropertyOptional({ description: 'Sub-category name', example: 'Fresh Vegetables' })
  name?: string;

  @ApiPropertyOptional({ description: 'Sub-category description', example: 'Fresh vegetable produce' })
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Whether the sub-category is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Locally sourced when possible' })
  note?: string;
}
