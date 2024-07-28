import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { type Website } from '../../types/types';

export class ResponseWebsiteDto implements Website {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'id of the website entry',
    default: undefined,
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Title of the webpage that is open',
    default: undefined,
  })
  websiteTitle: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Url of the webpage that is open',
    default: undefined,
  })
  websiteUrl: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Start time in ISO format',
    default: undefined,
  })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'End time in ISO format',
    default: undefined,
  })
  endedAt: string;
}
