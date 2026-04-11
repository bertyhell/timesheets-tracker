import { Inject, Injectable } from '@nestjs/common';
import type { Program } from '../types/types';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { differenceInSeconds, max, min } from 'date-fns';
import { CreateProgramDto } from './dto/create-activity.dto';
import { findAllPrograms } from './queries/findAllPrograms';
import { findOneProgram } from './queries/findOneProgram';
import { findByNextStartedAt } from './queries/findByNextStartedAt';
import { createProgram } from './queries/createProgram';
import { deleteProgram } from './queries/deleteProgram';

const MINIMUM_ACTIVITY_DURATION_SECONDS = 5;

@Injectable()
export class ProgramsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  adapt(rawProgram: Record<string, any>): Program {
    return rawProgram as Program;
  }

  async findAll(startedAt: string, endedAt: string): Promise<Program[]> {
    const results = await findAllPrograms(this.databaseService.getDb(), {
      startedAt,
      endedAt,
    });

    const realResults = results.filter((result) => {
      const diff = differenceInSeconds(new Date(result.endedAt), new Date(result.startedAt));
      return diff > MINIMUM_ACTIVITY_DURATION_SECONDS;
    });
    return realResults.map(this.adapt);
  }

  async findOne(id: string): Promise<Program> {
    const result = await findOneProgram(this.databaseService.getDb(), { id });

    return this.adapt(result);
  }

  async findByNextStartedAt(startedAt: string): Promise<Program> {
    const result = await findByNextStartedAt(this.databaseService.getDb(), { startedAt });

    return this.adapt(result);
  }

  async create(activity: CreateProgramDto): Promise<Program> {
    const id = uuid();
    await createProgram(this.databaseService.getDb(), {
      id,
      programName: activity.programName,
      windowTitle: activity.windowTitle,
      startedAt: min([new Date(activity.startedAt), new Date(activity.endedAt)]).toISOString(),
      endedAt: max([new Date(activity.startedAt), new Date(activity.endedAt)]).toISOString(),
    });

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await deleteProgram(this.databaseService.getDb(), { id });
  }
}
