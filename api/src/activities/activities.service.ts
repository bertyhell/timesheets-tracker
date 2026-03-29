import { Inject, Injectable } from '@nestjs/common';
import type { Activity } from '../types/types';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { differenceInSeconds, max, min } from 'date-fns';
import { CreateActivityDto } from './dto/create-activity.dto';
import { findAllActivities } from './queries/findAllActivities';
import { findOneActivity } from './queries/findOneActivity';
import { findByNextStartedAt } from './queries/findByNextStartedAt';
import { createActivity } from './queries/createActivity';
import { deleteActivity } from './queries/deleteActivity';

const MINIMUM_ACTIVITY_DURATION_SECONDS = 5;

@Injectable()
export class ActivitiesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  adapt(rawActivity: Record<string, any>): Activity {
    return rawActivity as Activity;
  }

  async findAll(startedAt: string, endedAt: string): Promise<Activity[]> {
    const results = await findAllActivities(this.databaseService.getDb(), {
      param1: startedAt,
      param2: endedAt,
    });

    const realResults = results.filter((result) => {
      const diff = differenceInSeconds(new Date(result.endedAt), new Date(result.startedAt));
      return diff > MINIMUM_ACTIVITY_DURATION_SECONDS;
    });
    return realResults.map(this.adapt);
  }

  async findOne(id: string): Promise<Activity> {
    const result = await findOneActivity(this.databaseService.getDb(), { param1: id });

    return this.adapt(result);
  }

  async findByNextStartedAt(startedAt: string): Promise<Activity> {
    const result = await findByNextStartedAt(this.databaseService.getDb(), { param1: startedAt });

    return this.adapt(result);
  }

  async create(activity: CreateActivityDto): Promise<Activity> {
    const id = uuid();
    await createActivity(this.databaseService.getDb(), {
      param1: id,
      param2: activity.programName,
      param3: activity.windowTitle,
      param4: min([new Date(activity.startedAt), new Date(activity.endedAt)]).toISOString(),
      param5: max([new Date(activity.startedAt), new Date(activity.endedAt)]).toISOString(),
    });

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await deleteActivity(this.databaseService.getDb(), { param1: id });
  }
}
