import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { DatabaseBackupsService } from './database-backups.service';
import {
  CreateDatabaseBackupDto,
  DatabaseBackupDto,
  RestoreDatabaseBackupResultDto,
} from './dto/database-backup.dto';

@ApiTags('database-backups')
@Controller('api/database-backups')
export class DatabaseBackupsController {
  constructor(private readonly databaseBackupsService: DatabaseBackupsService) {}

  @ApiOkResponse({
    description: 'List the database backups, newest first',
    type: DatabaseBackupDto,
    isArray: true,
  })
  @Get()
  findAll(): DatabaseBackupDto[] {
    return this.databaseBackupsService.listBackups();
  }

  @ApiOkResponse({
    description: 'Write a backup of the whole database to the backup folder',
    type: DatabaseBackupDto,
  })
  @Post()
  create(@Body() dto: CreateDatabaseBackupDto): DatabaseBackupDto {
    return this.databaseBackupsService.createBackup(dto?.label);
  }

  @ApiOkResponse({
    description:
      'Restore the tag names, tags, auto tags and auto notes from a backup. Recorded events are kept as they are.',
    type: RestoreDatabaseBackupResultDto,
  })
  @Post(':id/restore')
  @HttpCode(200)
  restore(@Param('id') id: string): RestoreDatabaseBackupResultDto {
    return this.databaseBackupsService.restoreBackup(id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.databaseBackupsService.deleteBackup(id);
  }
}
