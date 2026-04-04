import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the calendar',
  })
  title: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'URL to the iCalendar (.ics) file',
  })
  url: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Color used to display the calendar',
  })
  color: string;
}
