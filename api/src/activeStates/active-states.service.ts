import { Inject, Injectable } from '@nestjs/common';
import type { ActiveState } from '../types/types';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { CreateActiveStateDto } from './dto/create-active-state.dto';
import { unflatten } from 'nested-objects-util';
import { UpdateActiveStateDto } from './dto/update-active-state.dto';
import { CustomError } from '../shared/CustomError';
import { findAllActiveStates } from './queries/findAllActiveStates';
import { findOneActiveState } from './queries/findOneActiveState';
import { createActiveState } from './queries/createActiveState';
import { updateActiveState } from './queries/updateActiveState';
import { deleteActiveState } from './queries/deleteActiveState';

@Injectable()
export class ActiveStatesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  adapt(rawActiveState: Record<string, any> | null | undefined): ActiveState | null {
    if (!rawActiveState) {
      return null;
    }
    const unflattenedActiveState = unflatten(rawActiveState) as ActiveState;
    unflattenedActiveState.isActive = (unflattenedActiveState.isActive as unknown as 1 | 0) === 1;
    return unflattenedActiveState;
  }

  async findAll(startedAt: string, endedAt: string): Promise<ActiveState[]> {
    const results = await findAllActiveStates(this.databaseService.getDb(), {
      param1: startedAt,
      param2: endedAt,
    });
    return results.map(this.adapt);
  }

  async findOne(id: string): Promise<ActiveState> {
    try {
      const result = await findOneActiveState(this.databaseService.getDb(), { param1: id });

      return this.adapt(result);
    } catch (err) {
      throw new CustomError('Failed to fetch one activeState entry from the database', err, { id });
    }
  }

  async create(activeState: CreateActiveStateDto): Promise<ActiveState> {
    try {
      const id = uuid();
      await createActiveState(this.databaseService.getDb(), {
        param1: id,
        param2: activeState.isActive ? 1 : 0,
        param3: activeState.startedAt,
        param4: activeState.endedAt,
      });

      return this.findOne(id);
    } catch (err) {
      throw new CustomError('failed to create active state entry in the database', err, {
        activeState,
      });
    }
  }

  async update(id: string, updateActiveStateDto: UpdateActiveStateDto): Promise<ActiveState> {
    await updateActiveState(
      this.databaseService.getDb(),
      {
        param1: updateActiveStateDto.isActive ? 1 : 0,
        param2: updateActiveStateDto.startedAt,
        param3: updateActiveStateDto.endedAt,
      },
      { param1: id }
    );

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await deleteActiveState(this.databaseService.getDb(), { param1: id });
  }
}
