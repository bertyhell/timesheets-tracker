import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { IntegrationDto, UpsertIntegrationDto } from './dto/integration.dto';
import { deleteIntegration } from './queries/deleteIntegration';
import {
  findIntegrationByType,
  type FindIntegrationByTypeResult,
} from './queries/findIntegrationByType';
import { upsertIntegration } from './queries/upsertIntegration';

@Injectable()
export class IntegrationsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Includes the token, for server-side use by the integrations only. Never return this from a controller.
   */
  findOne(type: string): FindIntegrationByTypeResult | null {
    const db = this.databaseService.getDb();
    const row = findIntegrationByType(db, { type });
    return row ?? null;
  }

  findOnePublic(type: string): IntegrationDto | null {
    const row = this.findOne(type);
    return row ? toPublicIntegration(row) : null;
  }

  upsert(type: string, dto: UpsertIntegrationDto): IntegrationDto {
    const db = this.databaseService.getDb();
    // The client never receives the stored token, so an empty token means "keep the current one"
    const token = dto.token || this.findOne(type)?.token || '';
    const integration = { ...dto, type, token };
    upsertIntegration(db, integration);
    return toPublicIntegration(integration);
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

function toPublicIntegration({ token, ...rest }: FindIntegrationByTypeResult): IntegrationDto {
  return { ...rest, hasToken: !!token };
}
