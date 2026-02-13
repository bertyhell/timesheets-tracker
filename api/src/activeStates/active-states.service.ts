import { Inject, Injectable } from '@nestjs/common';
import type { ActiveState } from '../types/types';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { CreateActiveStateDto } from './dto/create-active-state.dto';
import { unflatten } from 'nested-objects-util';
import { UpdateActiveStateDto } from './dto/update-active-state.dto';
import { CustomError } from '../shared/CustomError';

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
    const results = await this.databaseService.exec('./src/activeStates/queries/findAllActiveStates.sql', {
      $startedAt: startedAt,
      $endedAt: endedAt,
    });
    return results.map(this.adapt);
  }

  async findOne(id: string): Promise<ActiveState> {
    try {
      const result = await this.databaseService.exec('./src/activeStates/queries/findOneActiveState.sql', {
        $id: id,
      });

      return this.adapt(result);
    } catch (err) {
      throw new CustomError('Failed to fetch one activeState entry from the database', err, { id });
    }
  }

  async create(activeState: CreateActiveStateDto): Promise<ActiveState> {
    try {
      const values = {
        $id: uuid(),
        $isActive: activeState.isActive ? 1 : 0,
        $startedAt: activeState.startedAt,
        $endedAt: activeState.endedAt,
      };
      await this.databaseService.exec('./src/activeStates/queries/createActiveState.sql', values);

      return this.findOne(values.$id);
    } catch (err) {
      throw new CustomError('failed to create active state entry in the database', err, {
        activeState,
      });
    }
  }

  async update(id: string, updateActiveStateDto: UpdateActiveStateDto): Promise<ActiveState> {
    const values = {
      $id: id,
      $isActive: updateActiveStateDto.isActive ? 1 : 0,
      $startedAt: updateActiveStateDto.startedAt,
      $endedAt: updateActiveStateDto.endedAt,
    };
    await this.databaseService.exec('./src/activeStates/queries/updateActiveState.sql', values);

    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.databaseService.exec('./src/activeStates/queries/deleteActiveState.sql', { $id: id });
  }
}
