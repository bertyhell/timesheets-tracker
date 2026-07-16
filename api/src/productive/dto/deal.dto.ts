import { ApiProperty } from '@nestjs/swagger';

export class ProductiveDealDto {
  @ApiProperty({ type: String, description: 'Productive deal ID' })
  dealId: string;

  @ApiProperty({ type: String, description: 'Name of the deal' })
  dealName: string;
}
