import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { TagNamesService } from './tag-names.service';
import { CreateTagNameDto } from './dto/create-tag-name.dto';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TagNameDto } from './dto/response-tag-name.dto';
import { UpdateTagNameDto } from './dto/update-tag-name.dto';
import { type TagName } from '../types/types';
// import { UpdateTagNameDto } from './dto/update-tag-name.dto';

@ApiTags('tag-names')
@Controller('api/tag-names')
export class TagNamesController {
  constructor(private readonly tagNamesService: TagNamesService) {}

  @ApiOkResponse({
    description: 'Create a new tag name entry',
    type: TagNameDto,
  })
  @Post()
  create(@Body() createTagNameDto: CreateTagNameDto) {
    return this.tagNamesService.create(createTagNameDto);
  }

  @ApiOkResponse({
    description: 'Get tag name entries optionally filtered by name',
    type: TagNameDto,
    isArray: true,
  })
  @Get()
  @ApiQuery({ name: 'term', required: false, type: 'string' })
  findAll(@Query('term') term?: string) {
    return this.tagNamesService.findAll(term);
  }

  @ApiOkResponse({
    description: 'Count the number of tag names',
    type: Number,
  })
  @Get('/count')
  async count(): Promise<{ count: number }> {
    return {
      count: await this.tagNamesService.count(),
    };
  }

  @ApiOkResponse({
    description: 'Get one tag name entry by id',
    type: TagNameDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagNamesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTagNameDto: UpdateTagNameDto): Promise<TagName> {
    return this.tagNamesService.update(id, updateTagNameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tagNamesService.remove(id);
  }
}
