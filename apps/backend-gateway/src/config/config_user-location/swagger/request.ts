import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserLocationUpdateRequest {
  @ApiPropertyOptional({ description: 'User IDs to assign to the location', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  user_ids?: string[];
}
