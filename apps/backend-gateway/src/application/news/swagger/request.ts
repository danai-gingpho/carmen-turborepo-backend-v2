import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNewsRequestDto {
  @ApiProperty({ description: 'News title', example: 'New inventory policy update' })
  title: string;

  @ApiPropertyOptional({ description: 'News content body', example: 'Starting next month, all inventory counts must be performed weekly.' })
  content?: string;

  @ApiPropertyOptional({ description: 'News category', example: 'announcement' })
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the news is published', example: true })
  is_published?: boolean;

  @ApiPropertyOptional({ description: 'Publish date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  publish_date?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;
}

export class UpdateNewsRequestDto {
  @ApiPropertyOptional({ description: 'News title', example: 'Updated inventory policy' })
  title?: string;

  @ApiPropertyOptional({ description: 'News content body', example: 'Updated content for the news item.' })
  content?: string;

  @ApiPropertyOptional({ description: 'News category', example: 'announcement' })
  category?: string;

  @ApiPropertyOptional({ description: 'Whether the news is published', example: true })
  is_published?: boolean;

  @ApiPropertyOptional({ description: 'Publish date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  publish_date?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;
}
