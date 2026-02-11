import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('status')
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  status(): { status: string; version: string } {
    return this.appService.status();
  }
}
