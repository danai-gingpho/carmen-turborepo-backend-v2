import { ApiProperty } from '@nestjs/swagger';

export class ProductCostRequestSwaggerDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Location ID', format: 'uuid', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  location_id: string;

  @ApiProperty({ description: 'Requested quantity', example: 10, minimum: 0 })
  quantity: number;
}
