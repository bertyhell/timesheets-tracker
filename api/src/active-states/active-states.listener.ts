import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

import { isActivityTrackingDisabled } from '../shared/is-activity-tracking-disabled';
import { logger } from '../shared/logger';
import { ActiveStatesService } from './active-states.service';
import { getActivitySnapshot } from './helpers/get-idle-state.helper';
import {
  type ActiveStateObservation,
  planActiveStateUpdate,
  type TrackedActiveState,
} from './helpers/plan-active-state-update.helper';
import { type ActivitySignal, watchActivitySignals } from './helpers/watch-activity-signals.helper';

/** How long without input before the user counts as away */
const IDLE_THRESHOLD_SECONDS = 2 * 60;
const POLLING_INTERVAL_SECONDS = 30;
/** A longer gap between polls means the computer was asleep */
const MAX_POLL_GAP_MS = POLLING_INTERVAL_SECONDS * 3 * 1000;

@Injectable()
export class ActiveStatesListener implements OnModuleDestroy {
  private current: TrackedActiveState | null = null;
  private lastObservedAt: number | null = null;
  /** Serializes checks so polls and D-Bus signals never write concurrently */
  private queue: Promise<void> = Promise.resolve();
  private stopWatchingSignals: (() => void) | null = null;
  private destroyed = false;

  constructor(@Inject(ActiveStatesService) private activeStatesService: ActiveStatesService) {
    if (isActivityTrackingDisabled()) return;
    this.checkActiveState();
    watchActivitySignals((signal) => this.handleSignal(signal))
      .then((stop) => {
        if (this.destroyed) stop();
        else this.stopWatchingSignals = stop;
      })
      .catch((error) =>
        logger.error('active state: failed to watch D-Bus signals: ' + (error?.message ?? error))
      );
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    this.stopWatchingSignals?.();
  }

  @Interval(POLLING_INTERVAL_SECONDS * 1000)
  private checkActiveState(): void {
    if (isActivityTrackingDisabled()) return;
    this.enqueue(async () => {
      const snapshot = await getActivitySnapshot(IDLE_THRESHOLD_SECONDS);
      await this.record({ at: Date.now(), ...snapshot });
    });
  }

  private handleSignal(signal: ActivitySignal): void {
    logger.info('active state signal: ' + signal);
    if (signal === 'sleeping') {
      const now = Date.now();
      this.enqueue(() => this.record({ at: now, isActive: false, inactiveSince: now }));
      return;
    }
    // locked / unlocked / resumed: read the current state right away
    this.checkActiveState();
  }

  private enqueue(task: () => Promise<void>): void {
    this.queue = this.queue.then(task).catch((error) => {
      logger.error('active state: failed to record: ' + (error?.message ?? error));
    });
  }

  private async record(observation: ActiveStateObservation): Promise<void> {
    const blocks = planActiveStateUpdate(
      this.current,
      this.lastObservedAt,
      observation,
      MAX_POLL_GAP_MS
    );
    this.lastObservedAt = observation.at;

    for (const block of blocks) {
      const dto = {
        isActive: block.isActive,
        startedAt: new Date(block.startedAt).toISOString(),
        endedAt: new Date(block.endedAt).toISOString(),
      };
      if (block.id) {
        await this.activeStatesService.update(block.id, dto);
      } else {
        block.id = (await this.activeStatesService.create(dto)).id;
      }
    }

    const next = blocks[blocks.length - 1];
    if (this.current && this.current.isActive !== next.isActive) {
      logger.info('active state changed to ' + next.isActive);
    }
    this.current = next;
  }
}
