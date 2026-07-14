import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { IntegrationDto, UpsertIntegrationDto } from './dto/integration.dto';
import { findIntegrationByType } from './queries/findIntegrationByType';
import { upsertIntegration } from './queries/upsertIntegration';
import { deleteIntegration } from './queries/deleteIntegration';

@Injectable()
export class IntegrationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  findOne(type: string): IntegrationDto | null {
    const db = this.databaseService.getDb();
    const row = findIntegrationByType(db, { type });
    return row ?? null;
  }

  upsert(type: string, dto: UpsertIntegrationDto): IntegrationDto {
    const db = this.databaseService.getDb();
    upsertIntegration(db, { type, ...dto });
    return { type, ...dto };
  }

  remove(type: string): void {
    const db = this.databaseService.getDb();
    const existing = findIntegrationByType(db, { type });
    if (!existing) {
      throw new NotFoundException(`Integration "${type}" not found`);
    }
    deleteIntegration(db, { type });
  }
}
