import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-activity.dto';
import { extractIconColor } from './helpers/extract-icon-color';
import { createWindowListener } from './helpers/create-window-listener';
import { MissingScreenRecordingPermissionError } from './helpers/default-window-listener';
import { type IWindowListener } from './helpers/window-listener.types';
import { isActivityTrackingDisabled } from '../shared/is-activity-tracking-disabled';
import { logger } from '../shared/logger';

@Injectable()
export class ProgramsListener implements OnApplicationBootstrap {
  private windowListener: IWindowListener | null = null;
  private lastProgram: CreateProgramDto | null = null;
  private _isTracking = false;
  private _trackingError: string | null = null;

  constructor(@Inject(ProgramsService) private programsService: ProgramsService) {}

  async onApplicationBootstrap() {
    if (isActivityTrackingDisabled()) return;
    // A tracking failure at boot (e.g. macOS screen recording permission not granted)
    // must not abort Nest startup: the same server serves the UI, so the app would
    // come up with no window at all. Log it, expose it, keep serving.
    try {
      await this.startListening();
    } catch (err) {
      logger.error(`could not start activity tracking: ${(err as Error).message}`);
    }
  }

  get isTracking(): boolean {
    return this._isTracking;
  }

  get trackingError(): string | null {
    return this._trackingError;
  }

  async startListening() {
    if (this._isTracking) return;
    this._isTracking = true;
    this._trackingError = null;
    this.windowListener = createWindowListener();
    try {
      await this.startWindowListener();
    } catch (err) {
      this._isTracking = false;
      this.windowListener = null;
      this._trackingError =
        err instanceof MissingScreenRecordingPermissionError
          ? err.message
          : `Could not start activity tracking: ${(err as Error).message}`;
      throw err;
    }
  }

  private async startWindowListener() {
    const initial = await this.windowListener!.start(async ({ program, icon }) => {
      await this.handleProgramChange(program, icon);
    });
    if (initial) {
      this.lastProgram = initial;
    }
  }

  async stopListening() {
    this._isTracking = false;
    this._trackingError = null;
    this.windowListener?.stop();
    this.windowListener = null;
    this.lastProgram = null;
  }

  private async handleProgramChange(currentProgram: CreateProgramDto, icon: string | null = null) {
    if (!this.lastProgram) {
      this.lastProgram = currentProgram;
      return;
    }

    if (
      // Same program and title — ignore
      (this.lastProgram.programName === currentProgram.programName &&
        this.lastProgram.windowTitle === currentProgram.windowTitle) ||
      // Windows Explorer with no title — ignore
      (currentProgram.programName === 'Windows Explorer' && currentProgram.windowTitle === '')
    ) {
      return;
    }

    const iconColor = icon ? await extractIconColor(this.lastProgram.programName, icon) : null;
    if (this.lastProgram.programName || this.lastProgram.windowTitle) {
      await this.programsService.create({
        programName: this.lastProgram.programName,
        windowTitle: this.lastProgram.windowTitle,
        startedAt: this.lastProgram.startedAt,
        endedAt: currentProgram.startedAt,
        iconColor: iconColor ?? undefined,
      });
    }

    this.lastProgram = currentProgram;
  }
}
