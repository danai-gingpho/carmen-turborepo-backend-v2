import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryCreateRequest {
  @ApiProperty({ description: 'Category name', example: 'Food & Beverage' })
  name: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'All food and beverage items' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Main category for kitchen supplies' })
  note?: string;
}

export class ProductCategoryUpdateRequest {
  @ApiPropertyOptional({ description: 'Category name', example: 'Food & Beverage' })
  name?: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'All food and beverage items' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Main category for kitchen supplies' })
  note?: string;
}
