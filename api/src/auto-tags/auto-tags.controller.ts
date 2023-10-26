import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
// import { AutoTagsService } from './auto-tags.service';
import { CreateAutoTagDto } from './dto/create-auto-tag.dto';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AutoTagsService } from './auto-tags.service';
import { AutoTagDto } from './dto/response-auto-tag.dto';
import { UpdateTagNameDto } from '../tag-names/dto/update-tag-name.dto';
import { AutoTag } from '../types/types';
import { UpdateAutoTagsDto } from './dto/update-auto-tags.dto';
// import { UpdateTagNameDto } from './dto/update-tag-name.dto';

@ApiTags('auto-tags')
@Controller('auto-tags')
export class AutoTagsController {
  constructor(private readonly tagNamesService: AutoTagsService) {}

  @ApiOkResponse({
    description:
      'Create an auto tag with conditions to identify when to apply the linked tagName to user activity',
    type: AutoTagDto,
  })
  @Post()
  create(@Body() createTagNameDto: CreateAutoTagDto) {
    return this.tagNamesService.create(createTagNameDto);
  }

  @ApiOkResponse({
    description:
      'Get a list of auto tags optionally filtered by a term that should occur in the name of the tag',
    type: AutoTagDto,
    isArray: true,
  })
  @Get()
  @ApiQuery({ name: 'term', required: false, type: 'string' })
  findAll(@Query('term') term?: string) {
    return this.tagNamesService.findAll(term);
  }

  @ApiOkResponse({
    description: 'Returns the number of auto tags that exist',
    type: Number,
  })
  @Get('/count')
  async count(): Promise<{ count: number }> {
    return {
      count: await this.tagNamesService.count(),
    };
  }

  @ApiOkResponse({
    description: 'Return a single auto tag by id',
    type: AutoTagDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagNamesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAutoTagNameDto: UpdateAutoTagsDto
  ): Promise<AutoTag> {
    return this.tagNamesService.update(id, updateAutoTagNameDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tagNamesService.delete(id);
  }
}
