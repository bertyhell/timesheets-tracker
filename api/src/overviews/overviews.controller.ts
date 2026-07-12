import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OverviewsService } from './overviews.service';
import { CreateSavedOverviewConfigDto } from './dto/create-saved-overview-config.dto';
import { UpdateSavedOverviewConfigDto } from './dto/update-saved-overview-config.dto';
import { SavedOverviewConfigDto } from './dto/response-saved-overview-config.dto';
import { OverviewFlatRowDto } from './dto/overview-flat-row.dto';
import { OverviewSourceType } from '../types/types';

@ApiTags('overviews')
@Controller('api/overviews')
export class OverviewsController {
  constructor(private readonly overviewsService: OverviewsService) {}

  @ApiOkResponse({
    description: 'Get flat, per-event rows for the given date range and source types, ready to feed a pivot table',
    type: OverviewFlatRowDto,
    isArray: true,
  })
  @Get('/data')
  @ApiQuery({ name: 'startedAt', required: true, type: 'string' })
  @ApiQuery({ name: 'endedAt', required: true, type: 'string' })
  @ApiQuery({ name: 'sourceTypes', required: true, type: 'string', isArray: true })
  getData(
    @Query('startedAt') startedAt: string,
    @Query('endedAt') endedAt: string,
    @Query('sourceTypes') sourceTypes: OverviewSourceType[]
  ) {
    const normalizedSourceTypes = Array.isArray(sourceTypes) ? sourceTypes : [sourceTypes];
    return this.overviewsService.getData(startedAt, endedAt, normalizedSourceTypes);
  }

  @ApiOkResponse({
    description: 'Create a new custom saved overview',
    type: SavedOverviewConfigDto,
  })
  @Post()
  create(@Body() createSavedOverviewConfigDto: CreateSavedOverviewConfigDto) {
    return this.overviewsService.create(createSavedOverviewConfigDto);
  }

  @ApiOkResponse({
    description: 'Get all saved custom overviews, ordered for the Overviews nav',
    type: SavedOverviewConfigDto,
    isArray: true,
  })
  @Get()
  findAll() {
    return this.overviewsService.findAll();
  }

  @ApiOkResponse({
    description: 'Get one saved overview by id',
    type: SavedOverviewConfigDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.overviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSavedOverviewConfigDto: UpdateSavedOverviewConfigDto) {
    return this.overviewsService.update(id, updateSavedOverviewConfigDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.overviewsService.remove(id);
  }
}
