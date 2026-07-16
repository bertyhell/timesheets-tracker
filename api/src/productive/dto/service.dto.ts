import { ApiProperty } from '@nestjs/swagger';

export class ProductiveServiceDto {
  @ApiProperty({ type: String, description: 'Productive service ID' })
  serviceId: string;

  @ApiProperty({ type: String, description: 'Name of the service' })
  serviceName: string;
}
