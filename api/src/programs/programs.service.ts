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
import { CustomError } from '../shared/CustomError';

const MINIMUM_ACTIVITY_DURATION_SECONDS = 5;

@Injectable()
export class ProgramsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  adapt(rawProgram: Record<string, any>): Program {
    return rawProgram as Program;
  }

  async findAll(startedAt: string, endedAt: string): Promise<Program[]> {
    try {
      const results = await findAllPrograms(this.databaseService.getDb(), {
        startedAt,
        endedAt,
      });

      const realResults = results.filter((result) => {
        const diff = differenceInSeconds(new Date(result.endedAt), new Date(result.startedAt));
        return diff > MINIMUM_ACTIVITY_DURATION_SECONDS;
      });
      return realResults.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all programs from the database', err, {
        startedAt,
        endedAt,
      });
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Program> {
    try {
      const result = findOneProgram(this.databaseService.getDb(), { id });

      return this.adapt(result);
    } catch (err) {
      const error = new CustomError('Failed to fetch one program from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async findByNextStartedAt(startedAt: string): Promise<Program> {
    try {
      const result = findByNextStartedAt(this.databaseService.getDb(), { startedAt });

      return this.adapt(result);
    } catch (err) {
      const error = new CustomError(
        'Failed to fetch program by next startedAt from the database',
        err,
        { startedAt }
      );
      console.error(error);
      throw error;
    }
  }

  async create(activity: CreateProgramDto): Promise<Program> {
    let id: string | null = null;
    try {
      id = uuid();
      createProgram(this.databaseService.getDb(), {
        id,
        programName: activity.programName,
        windowTitle: activity.windowTitle,
        startedAt: min([new Date(activity.startedAt), new Date(activity.endedAt)]).toISOString(),
        endedAt: max([new Date(activity.startedAt), new Date(activity.endedAt)]).toISOString(),
        iconColor: activity.iconColor ?? null,
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a program entry in the database', err, {
        id,
        activity,
      });
      console.error(error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      deleteProgram(this.databaseService.getDb(), { id });
    } catch (err) {
      const error = new CustomError('Failed to delete program entry from the database', err, { id });
      console.error(error);
      throw error;
    }
  }
}
