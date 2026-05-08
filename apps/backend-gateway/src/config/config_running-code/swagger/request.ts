import { ApiPropertyOptional } from '@nestjs/swagger';

class RunningCodeConfigDto {
  @ApiPropertyOptional({ description: 'Component A value', example: 'PR' })
  A?: string;

  @ApiPropertyOptional({ description: 'Component B value', example: 'YYYY' })
  B?: string;

  @ApiPropertyOptional({ description: 'Component C value', example: 'MM' })
  C?: string;

  @ApiPropertyOptional({ description: 'Component D value', example: '0001' })
  D?: string;

  @ApiPropertyOptional({ description: 'Format pattern using {A}{B}{C}{D} placeholders', example: '{A}{B}{C}{D}' })
  format?: string;
}

export class RunningCodeCreateRequest {
  @ApiPropertyOptional({ description: 'Running code type', example: 'purchase_request' })
  type?: string;

  @ApiPropertyOptional({ description: 'Running code configuration', type: RunningCodeConfigDto })
  config?: RunningCodeConfigDto;
}

export class RunningCodeUpdateRequest {
  @ApiPropertyOptional({ description: 'Running code type', example: 'purchase_request' })
  type?: string;

  @ApiPropertyOptional({ description: 'Running code configuration', type: RunningCodeConfigDto })
  config?: RunningCodeConfigDto;
}
