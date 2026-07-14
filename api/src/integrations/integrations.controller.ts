import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { IntegrationDto, UpsertIntegrationDto } from './dto/integration.dto';

@ApiTags('integrations')
@Controller('api/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @ApiOkResponse({ type: IntegrationDto, nullable: true })
  @Get(':type')
  findOne(@Param('type') type: string): IntegrationDto | null {
    return this.integrationsService.findOne(type);
  }

  @ApiOkResponse({ type: IntegrationDto })
  @Put(':type')
  upsert(@Param('type') type: string, @Body() dto: UpsertIntegrationDto): IntegrationDto {
    return this.integrationsService.upsert(type, dto);
  }

  @HttpCode(204)
  @Delete(':type')
  remove(@Param('type') type: string): void {
    this.integrationsService.remove(type);
  }
}
