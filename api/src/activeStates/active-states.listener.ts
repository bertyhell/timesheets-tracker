import { Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CreateActiveStateDto } from './dto/create-active-state.dto';
import { UpdateActiveStateDto } from './dto/update-active-state.dto';
import RealIdle from '@paymoapp/real-idle';
import { ResponseActiveStateDto } from './dto/response-active-state.dto';
import { ActiveStatesService } from './active-states.service';
import { noop } from 'lodash';
import { logger } from '../shared/logger';

const ACTIVE_STATE_POLLING_INTERVAL_SECONDS = 2 * 60;

@Injectable()
export class ActiveStatesListener {
  private lastActiveState: Partial<ResponseActiveStateDto> | null = null;

  constructor(@Inject(ActiveStatesService) private activeStatesService: ActiveStatesService) {
    this.checkActiveState().then(noop);
  }

  @Interval(ACTIVE_STATE_POLLING_INTERVAL_SECONDS * 1000)
  private async checkActiveState(): Promise<void> {
    const idleState = RealIdle.getIdleState(ACTIVE_STATE_POLLING_INTERVAL_SECONDS);
    const currentIsActiveState: boolean = {
      active: true,
      idlePrevented: true,
      idle: false,
      locked: false,
      unknown: false,
    }[idleState];
    if (!this.lastActiveState) {
      this.lastActiveState = {
        isActive: currentIsActiveState,
        startedAt: new Date().toISOString(),
      };
    } else {
      if (!this.lastActiveState.id) {
        // Haven't written to the database yet
        // Write first 5 minutes to database, keep track of id
        this.lastActiveState.endedAt = new Date().toISOString();
        this.lastActiveState = await this.activeStatesService.create(
          this.lastActiveState as CreateActiveStateDto
        );
      } else if (this.lastActiveState.isActive === currentIsActiveState) {
        // ActiveState stayed the same => update last entry's enddate
        this.lastActiveState.endedAt = new Date().toISOString();
        this.lastActiveState = await this.activeStatesService.update(
          this.lastActiveState.id,
          this.lastActiveState as UpdateActiveStateDto
        );
      } else {
        // ActiveState changes, write last activeState to database
        // Keep track of new active state locally
        logger.info('active state changed to ' + currentIsActiveState);
        this.lastActiveState.endedAt = new Date().toISOString();
        await this.activeStatesService.update(
          this.lastActiveState.id,
          this.lastActiveState as UpdateActiveStateDto
        );
        this.lastActiveState = {
          isActive: currentIsActiveState,
          startedAt: new Date().toISOString(),
        };
      }
    }
  }
}
