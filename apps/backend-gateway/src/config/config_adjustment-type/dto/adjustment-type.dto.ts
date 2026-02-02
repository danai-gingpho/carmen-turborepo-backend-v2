import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const AdjustmentTypeEnum = z.enum(['STOCK_IN', 'STOCK_OUT']);

export const AdjustmentTypeCreate = z.object({
  code: z.string(),
  name: z.string(),
  type: AdjustmentTypeEnum,
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  note: z.string().optional(),
  info: z.record(z.any()).optional(),
  dimension: z.array(z.any()).optional(),
});

export type ICreateAdjustmentType = z.infer<typeof AdjustmentTypeCreate>;
export class AdjustmentTypeCreateDto extends createZodDto(AdjustmentTypeCreate) {
  @ApiProperty({ description: 'Unique code for the adjustment type' })
  code: string;

  @ApiProperty({ description: 'Name of the adjustment type' })
  name: string;

  @ApiProperty({ enum: ['STOCK_IN', 'STOCK_OUT'], description: 'Type of adjustment' })
  type: 'STOCK_IN' | 'STOCK_OUT';

  @ApiPropertyOptional({ description: 'Description of the adjustment type' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the adjustment type is active', default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info as JSON object' })
  info?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Dimension data as JSON array' })
  dimension?: any[];
}

export const AdjustmentTypeUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  type: AdjustmentTypeEnum.optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  note: z.string().optional(),
  info: z.record(z.any()).optional(),
  dimension: z.array(z.any()).optional(),
});

export type IUpdateAdjustmentType = z.infer<typeof AdjustmentTypeUpdate> & { id: string };
export class AdjustmentTypeUpdateDto extends createZodDto(AdjustmentTypeUpdate) {
  @ApiPropertyOptional({ description: 'Unique code for the adjustment type' })
  code?: string;

  @ApiPropertyOptional({ description: 'Name of the adjustment type' })
  name?: string;

  @ApiPropertyOptional({ enum: ['STOCK_IN', 'STOCK_OUT'], description: 'Type of adjustment' })
  type?: 'STOCK_IN' | 'STOCK_OUT';

  @ApiPropertyOptional({ description: 'Description of the adjustment type' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the adjustment type is active' })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info as JSON object' })
  info?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Dimension data as JSON array' })
  dimension?: any[];
}
