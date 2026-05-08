import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileRequestDto {
  @ApiPropertyOptional({ description: 'Alias / display name', example: 'john.doe' })
  alias_name?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'William' })
  middlename?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Telephone number', example: '+66-81-234-5678' })
  telephone?: string;
}
