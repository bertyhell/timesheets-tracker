import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

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

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'API token' })
  token: string;
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

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'API token' })
  token: string;
}
