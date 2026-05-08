import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeEquipmentCategoryCreateRequest {
  @ApiProperty({ description: 'Category name', example: 'Baking Equipment' })
  name: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Equipment used for baking and pastry preparation' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes ovens, mixers, and proofing cabinets' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}

export class RecipeEquipmentCategoryUpdateRequest {
  @ApiPropertyOptional({ description: 'Category name', example: 'Baking Equipment' })
  name?: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Equipment used for baking and pastry preparation' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes ovens, mixers, and proofing cabinets' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}
