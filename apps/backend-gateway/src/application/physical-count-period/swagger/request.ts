import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhysicalCountPeriodCreateRequestDto {
  @ApiProperty({ description: 'Period ID (UUID referencing tb_period)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  period_id: string;

  @ApiPropertyOptional({ description: 'Status', example: 'draft', enum: ['draft', 'counting', 'completed'] })
  status?: string;
}

export class PhysicalCountPeriodUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Period ID (UUID referencing tb_period)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  period_id?: string;

  @ApiPropertyOptional({ description: 'Status', example: 'counting', enum: ['draft', 'counting', 'completed'] })
  status?: string;
}
