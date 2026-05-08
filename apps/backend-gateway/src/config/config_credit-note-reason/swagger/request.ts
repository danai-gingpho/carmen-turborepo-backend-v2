import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditNoteReasonCreateRequestDto {
  @ApiProperty({ description: 'Credit note reason name', example: 'Damaged goods' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the reason', example: 'Items received were damaged during transit' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Common for fragile items' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: {} })
  dimension?: unknown;
}

export class CreditNoteReasonUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Credit note reason name', example: 'Damaged goods' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the reason', example: 'Items received were damaged during transit' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Common for fragile items' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: {} })
  dimension?: unknown;
}
