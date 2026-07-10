import { ApiProperty } from '@nestjs/swagger';

export class ReorderTimelineItemDto {
  @ApiProperty() id: string;
  @ApiProperty() visualOrder: number;
}
