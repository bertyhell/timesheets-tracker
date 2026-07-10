import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { DatabaseService } from '../database/database.service';
import { SettingsResponseDto } from './dto/settings-response.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly databaseService: DatabaseService) {}

  getSettings(): SettingsResponseDto {
    return { databasePath: this.databaseService.databasePath };
  }

  async switchDatabasePath(newPath: string): Promise<SettingsResponseDto> {
    if (!fs.existsSync(newPath)) {
      throw new NotFoundException(`Database file not found: ${newPath}`);
    }
    this.writeConfig({ databasePath: newPath });
    await this.databaseService.switchDatabase(newPath);
    return { databasePath: newPath };
  }

  async moveDatabaseFile(newPath: string): Promise<SettingsResponseDto> {
    const currentPath = this.databaseService.databasePath;
    if (currentPath === newPath) {
      throw new BadRequestException('New path must differ from the current database path');
    }
    fs.copyFileSync(currentPath, newPath);
    return this.switchDatabasePath(newPath);
  }

  private writeConfig(config: { databasePath: string }): void {
    fs.writeFileSync(this.databaseService.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
