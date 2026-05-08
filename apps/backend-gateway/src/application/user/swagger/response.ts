import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDepartmentDto {
  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Kitchen' })
  name?: string;
}

export class UserHodDepartmentDto {
  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Kitchen' })
  name?: string;
}

export class UserBusinessUnitConfigDto {
  @ApiPropertyOptional({ description: 'Calculation method', example: 'FIFO' })
  calculation_method?: string;

  @ApiPropertyOptional({ description: 'Default currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  default_currency_id?: string;

  @ApiPropertyOptional({ description: 'Default currency details' })
  default_currency?: unknown;

  @ApiPropertyOptional({ description: 'Hotel details' })
  hotel?: unknown;

  @ApiPropertyOptional({ description: 'Company details' })
  company?: unknown;

  @ApiPropertyOptional({ description: 'Tax number', example: '0105556176744' })
  tax_no?: string;

  @ApiPropertyOptional({ description: 'Branch number', example: '00000' })
  branch_no?: string;

  @ApiPropertyOptional({ description: 'Date format', example: 'DD/MM/YYYY' })
  date_format?: string;

  @ApiPropertyOptional({ description: 'Timezone', example: 'Asia/Bangkok' })
  timezone?: string;
}

export class UserBusinessUnitDto {
  @ApiProperty({ description: 'Business unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Business unit name', example: 'Carmen Hotel' })
  name?: string;

  @ApiPropertyOptional({ description: 'Business unit code', example: 'CH001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'Carmen' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Is default business unit', example: true })
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'System level role', example: 'admin' })
  system_level?: string;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'User department', type: UserDepartmentDto })
  department?: UserDepartmentDto;

  @ApiPropertyOptional({ description: 'HOD departments', type: [UserHodDepartmentDto] })
  hod_department?: UserHodDepartmentDto[];

  @ApiPropertyOptional({ description: 'Business unit configuration', type: UserBusinessUnitConfigDto })
  config?: UserBusinessUnitConfigDto;
}

export class UserInfoDto {
  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'William' })
  middlename?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Telephone number', example: '+66-81-234-5678' })
  telephone?: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'john.doe' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'Platform role', example: 'user' })
  platform_role?: string;

  @ApiPropertyOptional({ description: 'User personal info', type: UserInfoDto })
  user_info?: UserInfoDto;

  @ApiPropertyOptional({ description: 'Assigned business units', type: [UserBusinessUnitDto] })
  business_unit?: UserBusinessUnitDto[];
}

export class UserPermissionResponseDto {
  @ApiPropertyOptional({ description: 'User permissions data', example: {} })
  permissions?: unknown;
}

export class UserListItemResponseDto {
  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Username', example: 'john.doe' })
  username?: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'William' })
  middlename?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Whether the user is active', example: true })
  is_active?: boolean;
}

export class UserListResponseDto {
  @ApiProperty({ description: 'List of user records', type: [UserListItemResponseDto] })
  data: UserListItemResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
