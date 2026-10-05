import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class IntegrationDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Integration type identifier (e.g. "productive")' })
  type: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Base URL of the integration API' })
  baseUrl: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Organisation ID' })
  organisationId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'User ID' })
  userId: string;

  // The token itself is never sent back to the client, only whether one is stored
  @IsBoolean()
  @ApiProperty({ type: Boolean, description: 'Whether an API token is stored' })
  hasToken: boolean;
}

export class UpsertIntegrationDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Base URL of the integration API' })
  baseUrl: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Organisation ID' })
  organisationId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'User ID' })
  userId: string;

  @IsOptional()
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'API token. Leave empty to keep the stored token',
  })
  token?: string;
}
