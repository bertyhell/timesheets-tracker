import { ApiProperty } from '@nestjs/swagger';

export class SettingDto {
  @ApiProperty({ type: String, description: 'Setting key' })
  key: string;

  @ApiProperty({ type: String, nullable: true, description: 'Setting value' })
  value: string | null;

  @ApiProperty({ type: String, description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ type: String, description: 'Last update timestamp' })
  updatedAt: string;
}
