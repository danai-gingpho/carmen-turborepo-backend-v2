import { ApiProperty } from '@nestjs/swagger';

export class SetDefaultTenantRequestDto {
  @ApiProperty({ description: 'Tenant ID to set as default', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tenant_id: string;
}
