import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';

import type { ActiveState } from '../types/types';

import { ActiveStatesService } from './active-states.service';
import { ResponseActiveStateDto } from './dto/response-active-state.dto';

@ApiTags('active-states')
@Controller('api/active-states')
export class ActiveStatesController {
  constructor(private readonly activeStatesService: ActiveStatesService) {}

  @Post()
  create(@Body() createActiveStateDto: ActiveState) {
    return this.activeStatesService.create(createActiveStateDto);
  }

  @ApiOkResponse({
    description: 'Get a list of all active states',
    type: ResponseActiveStateDto,
    isArray: true,
  })
  @Get()
  @ApiQuery({
    type: 'string',
    name: 'startedAt',
    required: true,
    example: startOfDay(new Date()).toISOString(),
  })
  @ApiQuery({
    type: 'string',
    name: 'endedAt',
    required: true,
    example: endOfDay(new Date()).toISOString(),
  })
  findAll(
    @Query('startedAt') startedAt: string,
    @Query('endedAt') endedAt: string
  ): Promise<ActiveState[]> {
    return this.activeStatesService.findAll(startedAt, endedAt);
  }

  @Get(':id')
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  findOne(@Param('id') id: string): Promise<ActiveState> {
    return this.activeStatesService.findOne(id);
  }

  @Delete()
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.activeStatesService.delete(id);
  }
}
