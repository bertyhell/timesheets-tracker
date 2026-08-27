import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsListener } from './programs.listener';
import type { Program } from '../types/types';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';
import { ResponseProgramDto } from './dto/response-activity.dto';

@ApiTags('programs')
@Controller('api/programs')
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly programsListener: ProgramsListener
  ) {}

  @Get('tracking')
  getTracking(): { isTracking: boolean; trackingError: string | null } {
    return {
      isTracking: this.programsListener.isTracking,
      trackingError: this.programsListener.trackingError,
    };
  }

  @Put('tracking')
  async setTracking(
    @Body() body: { enabled: boolean }
  ): Promise<{ isTracking: boolean; trackingError: string | null }> {
    if (body.enabled) {
      // Swallow: trackingError carries the reason back to the client, so a missing
      // screen recording permission shows up as a message instead of a 500.
      await this.programsListener.startListening().catch(() => undefined);
    } else {
      await this.programsListener.stopListening();
    }
    return {
      isTracking: this.programsListener.isTracking,
      trackingError: this.programsListener.trackingError,
    };
  }

  @Post()
  create(@Body() createProgramDto: Program) {
    return this.programsService.create(createProgramDto);
  }

  @ApiOkResponse({
    description: 'Get a list of all programs',
    type: ResponseProgramDto,
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
  ): Promise<Program[]> {
    return this.programsService.findAll(startedAt, endedAt);
  }

  @Get(':id')
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  findOne(@Param('id') id: string): Promise<Program> {
    return this.programsService.findOne(id);
  }

  @Delete()
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.programsService.delete(id);
  }
}
