import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { type Website } from '../../types/types';

export class ResponseWebsiteDto implements Website {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'id of the website entry',
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the webpage that is open',
  })
  websiteTitle: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Url of the webpage that is open',
  })
  websiteUrl: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Start time in ISO format',
  })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'End time in ISO format',
  })
  endedAt: string;
}
