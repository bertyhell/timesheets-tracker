import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { type AutoNotesService } from './auto-notes.service';
import { type CreateAutoNoteDto } from './dto/create-auto-note.dto';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AutoNoteDto } from './dto/response-auto-note.dto';
import { type UpdateAutoNoteDto } from './dto/update-auto-note.dto';
import { type AutoNote } from '../types/types';

@ApiTags('autoNotes')
@Controller('api/auto-notes')
export class AutoNotesController {
  constructor(private readonly AutoNotesService: AutoNotesService) {}

  @ApiOkResponse({
    description: 'Create a new autoNote rule',
    type: AutoNoteDto,
  })
  @Post()
  create(@Body() createAutoNoteDto: CreateAutoNoteDto) {
    return this.AutoNotesService.create(createAutoNoteDto);
  }

  @ApiOkResponse({
    description: 'Get autoNote entries optionally filtered by name',
    type: AutoNoteDto,
    isArray: true,
  })
  @Get()
  @ApiQuery({ name: 'term', required: false, type: 'string' })
  findAll(@Query('term') term?: string) {
    return this.AutoNotesService.findAll(term);
  }

  @ApiOkResponse({
    description: 'Count the number of autoNotes',
    type: Number,
  })
  @Get('/count')
  async count(): Promise<{ count: number }> {
    return {
      count: await this.AutoNotesService.count(),
    };
  }

  @ApiOkResponse({
    description: 'Get one autoNote entry by id',
    type: AutoNoteDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.AutoNotesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAutoNoteDto: UpdateAutoNoteDto): Promise<AutoNote> {
    return this.AutoNotesService.update(id, updateAutoNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.AutoNotesService.remove(id);
  }
}
