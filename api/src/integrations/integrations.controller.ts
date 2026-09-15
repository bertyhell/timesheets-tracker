import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';

import { IntegrationDto, UpsertIntegrationDto } from './dto/integration.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiExtraModels(IntegrationDto)
@Controller('api/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // `nullable` is not valid alongside `type` in @nestjs/swagger v11; express the
  // nullable response through an explicit schema instead.
  @ApiOkResponse({
    schema: { allOf: [{ $ref: getSchemaPath(IntegrationDto) }], nullable: true },
  })
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
