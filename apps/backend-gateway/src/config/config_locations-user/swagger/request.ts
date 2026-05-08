import { ApiPropertyOptional } from '@nestjs/swagger';

export class LocationUserUpdateRequest {
  @ApiPropertyOptional({ description: 'Location IDs to assign to the user', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  location_ids?: string[];
}
