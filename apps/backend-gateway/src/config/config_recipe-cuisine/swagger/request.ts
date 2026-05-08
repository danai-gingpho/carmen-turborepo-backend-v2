import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeCuisineCreateRequest {
  @ApiProperty({ description: 'Cuisine name', example: 'Thai' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the cuisine', example: 'Traditional Thai cuisine' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Known for spicy and aromatic dishes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the cuisine is active', example: true, default: true })
  is_active?: boolean;

  @ApiProperty({ description: 'Cuisine region', example: 'ASIAN' })
  region: string;

  @ApiPropertyOptional({ description: 'Popular dishes (JSON)', example: ['Pad Thai', 'Tom Yum'] })
  popular_dishes?: unknown;

  @ApiPropertyOptional({ description: 'Key ingredients (JSON)', example: ['lemongrass', 'galangal', 'kaffir lime'] })
  key_ingredients?: unknown;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}

export class RecipeCuisineUpdateRequest {
  @ApiPropertyOptional({ description: 'Cuisine name', example: 'Thai' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the cuisine', example: 'Traditional Thai cuisine' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Known for spicy and aromatic dishes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the cuisine is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Cuisine region', example: 'ASIAN' })
  region?: string;

  @ApiPropertyOptional({ description: 'Popular dishes (JSON)', example: ['Pad Thai', 'Tom Yum'] })
  popular_dishes?: unknown;

  @ApiPropertyOptional({ description: 'Key ingredients (JSON)', example: ['lemongrass', 'galangal', 'kaffir lime'] })
  key_ingredients?: unknown;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}
