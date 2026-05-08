import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeCategoryCreateRequest {
  @ApiProperty({ description: 'Recipe category code', example: 'RC-001' })
  code: string;

  @ApiProperty({ description: 'Recipe category name', example: 'Appetizers' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the category', example: 'Starter dishes and appetizers' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes both hot and cold appetizers' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchical structure', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  parent_id?: string;

  @ApiPropertyOptional({ description: 'Hierarchy level', example: 1 })
  level?: number;

  @ApiPropertyOptional({ description: 'Default cost settings (JSON)', example: {} })
  default_cost_settings?: unknown;

  @ApiPropertyOptional({ description: 'Default margins (JSON)', example: {} })
  default_margins?: unknown;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}

export class RecipeCategoryUpdateRequest {
  @ApiPropertyOptional({ description: 'Recipe category code', example: 'RC-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Recipe category name', example: 'Appetizers' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the category', example: 'Starter dishes and appetizers' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes both hot and cold appetizers' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchical structure', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  parent_id?: string;

  @ApiPropertyOptional({ description: 'Hierarchy level', example: 1 })
  level?: number;

  @ApiPropertyOptional({ description: 'Default cost settings (JSON)', example: {} })
  default_cost_settings?: unknown;

  @ApiPropertyOptional({ description: 'Default margins (JSON)', example: {} })
  default_margins?: unknown;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}
