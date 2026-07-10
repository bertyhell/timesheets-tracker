import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { SwitchDatabaseDto } from './dto/switch-database.dto';

@ApiTags('settings')
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOkResponse({ type: SettingsResponseDto })
  @Get()
  getSettings(): SettingsResponseDto {
    return this.settingsService.getSettings();
  }

  @ApiOkResponse({ type: SettingsResponseDto })
  @Post('switch-database')
  switchDatabase(@Body() dto: SwitchDatabaseDto): Promise<SettingsResponseDto> {
    return this.settingsService.switchDatabasePath(dto.path);
  }

  @ApiOkResponse({ type: SettingsResponseDto })
  @Post('move-database')
  moveDatabase(@Body() dto: SwitchDatabaseDto): Promise<SettingsResponseDto> {
    return this.settingsService.moveDatabaseFile(dto.path);
  }
}
