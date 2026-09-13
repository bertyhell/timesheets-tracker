import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CsvExportService } from './csv-export.service';
import { CsvExportConfigDto } from './dto/csv-export-config.dto';

@ApiTags('csv-export')
@Controller('api/csv-export')
export class CsvExportController {
  constructor(private readonly csvExportService: CsvExportService) {}

  @ApiOkResponse({ type: CsvExportConfigDto })
  @Get('config')
  getConfig(): CsvExportConfigDto {
    return this.csvExportService.getConfig();
  }

  @ApiOkResponse({ type: CsvExportConfigDto })
  @Put('config')
  saveConfig(@Body() dto: CsvExportConfigDto): CsvExportConfigDto {
    return this.csvExportService.saveConfig(dto);
  }
}
