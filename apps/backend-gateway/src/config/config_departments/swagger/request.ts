import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentCreateRequestDto {
  @ApiProperty({ description: 'Department code', example: 'DEP-001' })
  code: string;

  @ApiProperty({ description: 'Department name', example: 'Kitchen' })
  name: string;

  @ApiPropertyOptional({ description: 'Department description', example: 'Main kitchen department' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the department is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Handles all food preparation' })
  note?: string;
}

export class DepartmentUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Department code', example: 'DEP-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Kitchen' })
  name?: string;

  @ApiPropertyOptional({ description: 'Department description', example: 'Main kitchen department' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the department is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Handles all food preparation' })
  note?: string;
}
