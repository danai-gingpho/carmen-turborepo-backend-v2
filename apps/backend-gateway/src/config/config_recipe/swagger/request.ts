import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeCreateRequestDto {
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

  @ApiPropertyOptional({ description: 'Recipe difficulty level', example: 'MEDIUM', enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] })
  difficulty?: string;

  @ApiProperty({ description: 'Base yield quantity', example: 4.0 })
  base_yield: number;

  @ApiProperty({ description: 'Base yield unit', example: 'portions' })
  base_yield_unit: string;

  @ApiPropertyOptional({ description: 'Default variant ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  default_variant_id?: string;

  @ApiPropertyOptional({ description: 'Preparation time in minutes', example: 30 })
  prep_time?: number;

  @ApiPropertyOptional({ description: 'Cooking time in minutes', example: 20 })
  cook_time?: number;

  @ApiPropertyOptional({ description: 'Total ingredient cost', example: 150.0 })
  total_ingredient_cost?: number;

  @ApiPropertyOptional({ description: 'Labor cost', example: 50.0 })
  labor_cost?: number;

  @ApiPropertyOptional({ description: 'Overhead cost', example: 20.0 })
  overhead_cost?: number;

  @ApiPropertyOptional({ description: 'Cost per portion', example: 55.0 })
  cost_per_portion?: number;

  @ApiPropertyOptional({ description: 'Suggested selling price', example: 250.0 })
  suggested_price?: number;

  @ApiPropertyOptional({ description: 'Actual selling price', example: 280.0 })
  selling_price?: number;

  @ApiPropertyOptional({ description: 'Target food cost percentage', example: 30.0 })
  target_food_cost_percentage?: number;

  @ApiPropertyOptional({ description: 'Whether to deduct ingredients from stock', example: true })
  deduct_from_stock?: boolean;

  @ApiPropertyOptional({ description: 'Recipe status', example: 'DRAFT', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Recipe tags (JSON)', example: ['thai', 'spicy', 'seafood'] })
  tags?: unknown;

  @ApiPropertyOptional({ description: 'Allergens (JSON)', example: ['shellfish'] })
  allergens?: unknown;
}

export class RecipeUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Recipe code', example: 'RCP-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Recipe name', example: 'Tom Yum Goong' })
  name?: string;

  @ApiPropertyOptional({ description: 'Recipe description', example: 'Traditional Thai spicy shrimp soup' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Signature dish' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the recipe is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Category ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Cuisine ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cuisine_id?: string;

  @ApiPropertyOptional({ description: 'Recipe difficulty level', example: 'MEDIUM', enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] })
  difficulty?: string;

  @ApiPropertyOptional({ description: 'Base yield quantity', example: 4.0 })
  base_yield?: number;

  @ApiPropertyOptional({ description: 'Base yield unit', example: 'portions' })
  base_yield_unit?: string;

  @ApiPropertyOptional({ description: 'Preparation time in minutes', example: 30 })
  prep_time?: number;

  @ApiPropertyOptional({ description: 'Cooking time in minutes', example: 20 })
  cook_time?: number;

  @ApiPropertyOptional({ description: 'Total ingredient cost', example: 150.0 })
  total_ingredient_cost?: number;

  @ApiPropertyOptional({ description: 'Selling price', example: 280.0 })
  selling_price?: number;

  @ApiPropertyOptional({ description: 'Whether to deduct ingredients from stock', example: true })
  deduct_from_stock?: boolean;

  @ApiPropertyOptional({ description: 'Recipe status', example: 'ACTIVE', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] })
  status?: string;
}
