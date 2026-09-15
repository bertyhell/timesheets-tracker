import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('status')
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  status(): { status: string; version: string } {
    return this.appService.status();
  }
}
