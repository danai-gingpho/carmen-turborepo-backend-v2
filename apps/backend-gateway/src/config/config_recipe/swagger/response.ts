import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeResponseDto {
  @ApiProperty({ description: 'Recipe ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Recipe code', example: 'RCP-001' })
  code: string;

  @ApiProperty({ description: 'Recipe name', example: 'Tom Yum Goong' })
  name: string;

  @ApiPropertyOptional({ description: 'Recipe description', example: 'Traditional Thai spicy shrimp soup' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Signature dish' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the recipe is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Recipe images (JSON array)', example: [] })
  images?: unknown;

  @ApiProperty({ description: 'Category ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id: string;

  @ApiProperty({ description: 'Cuisine ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cuisine_id: string;

  @ApiPropertyOptional({ description: 'Category details', example: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Main Course', code: 'MC' } })
  category?: unknown;

  @ApiPropertyOptional({ description: 'Cuisine details', example: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', name: 'Thai', region: 'SOUTHEAST_ASIAN' } })
  cuisine?: unknown;

  @ApiProperty({ description: 'Recipe difficulty level', example: 'MEDIUM' })
  difficulty: string;

  @ApiProperty({ description: 'Base yield quantity', example: 4.0 })
  base_yield: number;

  @ApiProperty({ description: 'Base yield unit', example: 'portions' })
  base_yield_unit: string;

  @ApiPropertyOptional({ description: 'Default variant ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  default_variant_id?: string;

  @ApiProperty({ description: 'Preparation time in minutes', example: 30 })
  prep_time: number;

  @ApiProperty({ description: 'Cooking time in minutes', example: 20 })
  cook_time: number;

  @ApiProperty({ description: 'Total ingredient cost', example: 150.0 })
  total_ingredient_cost: number;

  @ApiProperty({ description: 'Labor cost', example: 50.0 })
  labor_cost: number;

  @ApiProperty({ description: 'Overhead cost', example: 20.0 })
  overhead_cost: number;

  @ApiProperty({ description: 'Cost per portion', example: 55.0 })
  cost_per_portion: number;

  @ApiPropertyOptional({ description: 'Suggested selling price', example: 250.0 })
  suggested_price?: number;

  @ApiPropertyOptional({ description: 'Actual selling price', example: 280.0 })
  selling_price?: number;

  @ApiPropertyOptional({ description: 'Target food cost percentage', example: 30.0 })
  target_food_cost_percentage?: number;

  @ApiPropertyOptional({ description: 'Actual food cost percentage', example: 28.5 })
  actual_food_cost_percentage?: number;

  @ApiPropertyOptional({ description: 'Gross margin', example: 200.0 })
  gross_margin?: number;

  @ApiPropertyOptional({ description: 'Gross margin percentage', example: 71.5 })
  gross_margin_percentage?: number;

  @ApiProperty({ description: 'Whether to deduct ingredients from stock', example: true })
  deduct_from_stock: boolean;

  @ApiProperty({ description: 'Recipe status', example: 'DRAFT' })
  status: string;

  @ApiPropertyOptional({ description: 'Recipe tags (JSON)', example: ['thai', 'spicy'] })
  tags?: unknown;

  @ApiPropertyOptional({ description: 'Allergens (JSON)', example: ['shellfish'] })
  allergens?: unknown;

  @ApiPropertyOptional({ description: 'Recipe ingredients', example: [] })
  ingredients?: unknown;

  @ApiPropertyOptional({ description: 'Preparation steps', example: [] })
  preparation_steps?: unknown;

  @ApiPropertyOptional({ description: 'Yield variants', example: [] })
  yield_variants?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-01-15T10:30:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-01-15T10:30:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class RecipeListResponseDto {
  @ApiProperty({ description: 'List of Recipe records', type: [RecipeResponseDto] })
  data: RecipeResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class RecipeMutationResponseDto {
  @ApiProperty({ description: 'Recipe ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
