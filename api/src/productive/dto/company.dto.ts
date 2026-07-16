import { ApiProperty } from '@nestjs/swagger';

export class ProductiveCompanyDto {
  @ApiProperty({ type: String, description: 'Productive company ID' })
  companyId: string;

  @ApiProperty({ type: String, description: 'Name of the company' })
  companyName: string;
}
