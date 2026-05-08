import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeCategoryResponseDto {
  @ApiProperty({ description: 'Recipe category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Recipe category code', example: 'RC-001' })
  code: string;

  @ApiProperty({ description: 'Recipe category name', example: 'Appetizers' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the category', example: 'Starter dishes and appetizers' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes both hot and cold appetizers' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Parent category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  parent_id?: string;

  @ApiPropertyOptional({ description: 'Parent category name', example: 'Main Courses' })
  parent_name?: string;

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

export class RecipeCategoryListResponseDto {
  @ApiProperty({ description: 'List of RecipeCategory records', type: [RecipeCategoryResponseDto] })
  data: RecipeCategoryResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class RecipeCategoryMutationResponseDto {
  @ApiProperty({ description: 'RecipeCategory ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
