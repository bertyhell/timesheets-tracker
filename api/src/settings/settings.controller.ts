import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { SwitchDatabaseDto } from './dto/switch-database.dto';
import { SettingDto } from './dto/setting.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import {
  DeleteEventsAfterDto,
  DeleteEventsAfterPreviewDto,
  UpsertDeleteEventsAfterDto,
} from './dto/delete-events-after.dto';

@ApiTags('settings')
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOkResponse({ type: SettingsResponseDto })
  @Get()
  getSettings(): SettingsResponseDto {
    return this.settingsService.getSettings();
  }

  @ApiOkResponse({ type: SettingDto, nullable: true })
  @Get('key/:key')
  getSettingByKey(@Param('key') key: string): SettingDto | null {
    return this.settingsService.getSettingByKey(key);
  }

  @ApiOkResponse({ type: SettingDto })
  @Put('key/:key')
  setSettingByKey(@Param('key') key: string, @Body() dto: UpsertSettingDto): SettingDto {
    return this.settingsService.setSettingByKey(key, dto.value);
  }

  @ApiOkResponse({ type: DeleteEventsAfterDto })
  @Get('delete-events-after')
  getDeleteEventsAfter(): DeleteEventsAfterDto {
    return this.settingsService.getDeleteEventsAfter();
  }

  @ApiOkResponse({ type: DeleteEventsAfterDto })
  @Put('delete-events-after')
  setDeleteEventsAfter(@Body() dto: UpsertDeleteEventsAfterDto): DeleteEventsAfterDto {
    return this.settingsService.setDeleteEventsAfter(dto);
  }

  @ApiOkResponse({ type: DeleteEventsAfterDto })
  @Delete('delete-events-after')
  clearDeleteEventsAfter(): DeleteEventsAfterDto {
    return this.settingsService.clearDeleteEventsAfter();
  }

  @ApiOkResponse({ type: DeleteEventsAfterPreviewDto })
  @ApiQuery({ name: 'numeric', type: String, required: false })
  @ApiQuery({ name: 'unit', type: String, required: false })
  @Get('delete-events-after/preview')
  previewDeleteEventsAfter(
    @Query('numeric') numeric?: string,
    @Query('unit') unit?: string
  ): DeleteEventsAfterPreviewDto {
    return this.settingsService.previewDeleteEventsAfter(numeric, unit);
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

  @Post('open-database-folder')
  openDatabaseFolder(): void {
    this.settingsService.openDatabaseFolder();
  }
}
