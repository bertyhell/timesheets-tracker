import { ApiProperty } from '@nestjs/swagger';

export class ReorderAutoTagItemDto {
  @ApiProperty() id: string;
  @ApiProperty() priority: number;
}
