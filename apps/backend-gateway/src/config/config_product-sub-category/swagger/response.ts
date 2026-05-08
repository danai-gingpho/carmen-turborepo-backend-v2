import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSubCategoryResponseDto {
  @ApiProperty({ description: 'Product sub-category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Sub-category name', example: 'Fresh Vegetables' })
  name: string;

  @ApiPropertyOptional({ description: 'Sub-category description', example: 'Fresh vegetable produce' })
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Whether the sub-category is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Locally sourced when possible' })
  note?: string;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who created the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who last updated the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class ProductSubCategoryListResponseDto {
  @ApiProperty({ description: 'List of ProductSubCategory records', type: [ProductSubCategoryResponseDto] })
  data: ProductSubCategoryResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class ProductSubCategoryMutationResponseDto {
  @ApiProperty({ description: 'ProductSubCategory ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
