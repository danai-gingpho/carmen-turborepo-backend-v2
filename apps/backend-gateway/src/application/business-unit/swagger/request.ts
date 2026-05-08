import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BusinessUnitCreateRequestDto {
  @ApiProperty({ description: 'Cluster ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cluster_id: string;

  @ApiProperty({ description: 'Business unit code (min 3 chars)', example: 'BU001' })
  code: string;

  @ApiProperty({ description: 'Business unit name (min 3 chars)', example: 'Head Office' })
  name: string;

  @ApiPropertyOptional({ description: 'Alias name (min 3 chars)', example: 'HO' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Main head office business unit' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Default currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  default_currency_id?: string;

  @ApiPropertyOptional({ description: 'Maximum number of licensed users', example: 50 })
  max_license_users?: number;

  @ApiProperty({ description: 'Is headquarters', example: true })
  is_hq: boolean;

  @ApiProperty({ description: 'Is active', example: true })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Database connection config (JSON)', example: {} })
  db_connection?: unknown;

  @ApiPropertyOptional({ description: 'Business unit config (JSON)', example: {} })
  config?: unknown;

  @ApiPropertyOptional({ description: 'Calculation method', enum: ['average', 'fifo'], example: 'average' })
  calculation_method?: string;

  // Company info
  @ApiPropertyOptional({ description: 'Branch number', example: '00000' })
  branch_no?: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'Carmen Hotel Co., Ltd.' })
  company_name?: string;

  @ApiPropertyOptional({ description: 'Company address', example: '123 Main St.' })
  company_address?: string;

  @ApiPropertyOptional({ description: 'Company email', example: 'info@carmen.com' })
  company_email?: string;

  @ApiPropertyOptional({ description: 'Company telephone', example: '+66-2-123-4567' })
  company_tel?: string;

  @ApiPropertyOptional({ description: 'Company zip code', example: '10110' })
  company_zip_code?: string;

  @ApiPropertyOptional({ description: 'Tax number', example: '1234567890123' })
  tax_no?: string;

  // Hotel info
  @ApiPropertyOptional({ description: 'Hotel name', example: 'Carmen Grand Hotel' })
  hotel_name?: string;

  @ApiPropertyOptional({ description: 'Hotel address', example: '456 Beach Rd.' })
  hotel_address?: string;

  @ApiPropertyOptional({ description: 'Hotel email', example: 'hotel@carmen.com' })
  hotel_email?: string;

  @ApiPropertyOptional({ description: 'Hotel telephone', example: '+66-2-765-4321' })
  hotel_tel?: string;

  @ApiPropertyOptional({ description: 'Hotel zip code', example: '10120' })
  hotel_zip_code?: string;

  // Format settings
  @ApiPropertyOptional({ description: 'Date format', example: 'yyyy-MM-dd' })
  date_format?: string;

  @ApiPropertyOptional({ description: 'Date-time format', example: 'yyyy-MM-dd HH:mm:ss' })
  date_time_format?: string;

  @ApiPropertyOptional({ description: 'Time format', example: 'HH:mm:ss' })
  time_format?: string;

  @ApiPropertyOptional({ description: 'Short time format', example: 'HH:mm' })
  short_time_format?: string;

  @ApiPropertyOptional({ description: 'Long time format', example: 'HH:mm:ss' })
  long_time_format?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'Asia/Bangkok' })
  timezone?: string;

  @ApiPropertyOptional({ description: 'Amount format config (JSON)', example: {} })
  amount_format?: unknown;

  @ApiPropertyOptional({ description: 'Quantity format config (JSON)', example: {} })
  quantity_format?: unknown;

  @ApiPropertyOptional({ description: 'Per-page format config (JSON)', example: {} })
  perpage_format?: unknown;

  @ApiPropertyOptional({ description: 'Recipe format config (JSON)', example: {} })
  recipe_format?: unknown;
}

export class BusinessUnitUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Cluster ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  cluster_id?: string;

  @ApiPropertyOptional({ description: 'Business unit code (min 3 chars)', example: 'BU001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Business unit name (min 3 chars)', example: 'Head Office' })
  name?: string;

  @ApiPropertyOptional({ description: 'Alias name (min 3 chars)', example: 'HO' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Main head office business unit' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Default currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  default_currency_id?: string;

  @ApiPropertyOptional({ description: 'Maximum number of licensed users', example: 50 })
  max_license_users?: number;

  @ApiPropertyOptional({ description: 'Is headquarters', example: true })
  is_hq?: boolean;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Database connection config (JSON)', example: {} })
  db_connection?: unknown;

  @ApiPropertyOptional({ description: 'Business unit config (JSON)', example: {} })
  config?: unknown;

  @ApiPropertyOptional({ description: 'Calculation method', enum: ['average', 'fifo'], example: 'average' })
  calculation_method?: string;

  // Company info
  @ApiPropertyOptional({ description: 'Branch number', example: '00000' })
  branch_no?: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'Carmen Hotel Co., Ltd.' })
  company_name?: string;

  @ApiPropertyOptional({ description: 'Company address', example: '123 Main St.' })
  company_address?: string;

  @ApiPropertyOptional({ description: 'Company email', example: 'info@carmen.com' })
  company_email?: string;

  @ApiPropertyOptional({ description: 'Company telephone', example: '+66-2-123-4567' })
  company_tel?: string;

  @ApiPropertyOptional({ description: 'Company zip code', example: '10110' })
  company_zip_code?: string;

  @ApiPropertyOptional({ description: 'Tax number', example: '1234567890123' })
  tax_no?: string;

  // Hotel info
  @ApiPropertyOptional({ description: 'Hotel name', example: 'Carmen Grand Hotel' })
  hotel_name?: string;

  @ApiPropertyOptional({ description: 'Hotel address', example: '456 Beach Rd.' })
  hotel_address?: string;

  @ApiPropertyOptional({ description: 'Hotel email', example: 'hotel@carmen.com' })
  hotel_email?: string;

  @ApiPropertyOptional({ description: 'Hotel telephone', example: '+66-2-765-4321' })
  hotel_tel?: string;

  @ApiPropertyOptional({ description: 'Hotel zip code', example: '10120' })
  hotel_zip_code?: string;

  // Format settings
  @ApiPropertyOptional({ description: 'Date format', example: 'yyyy-MM-dd' })
  date_format?: string;

  @ApiPropertyOptional({ description: 'Date-time format', example: 'yyyy-MM-dd HH:mm:ss' })
  date_time_format?: string;

  @ApiPropertyOptional({ description: 'Time format', example: 'HH:mm:ss' })
  time_format?: string;

  @ApiPropertyOptional({ description: 'Short time format', example: 'HH:mm' })
  short_time_format?: string;

  @ApiPropertyOptional({ description: 'Long time format', example: 'HH:mm:ss' })
  long_time_format?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'Asia/Bangkok' })
  timezone?: string;

  @ApiPropertyOptional({ description: 'Amount format config (JSON)', example: {} })
  amount_format?: unknown;

  @ApiPropertyOptional({ description: 'Quantity format config (JSON)', example: {} })
  quantity_format?: unknown;

  @ApiPropertyOptional({ description: 'Per-page format config (JSON)', example: {} })
  perpage_format?: unknown;

  @ApiPropertyOptional({ description: 'Recipe format config (JSON)', example: {} })
  recipe_format?: unknown;
}
