import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';

import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-activity.dto';
import { extractIconColor } from './helpers/extract-icon-color';
import { createWindowListener } from './helpers/create-window-listener';
import { type IWindowListener } from './helpers/window-listener.types';

@Injectable()
export class ProgramsListener implements OnApplicationBootstrap {
  private windowListener: IWindowListener | null = null;
  private lastProgram: CreateProgramDto | null = null;
  private _isTracking = false;

  constructor(@Inject(ProgramsService) private programsService: ProgramsService) {}

  async onApplicationBootstrap() {
    await this.startListening();
  }

  get isTracking(): boolean {
    return this._isTracking;
  }

  async startListening() {
    if (this._isTracking) return;
    this._isTracking = true;
    this.windowListener = createWindowListener();
    const initial = await this.windowListener.start(async ({ program, icon }) => {
      await this.handleProgramChange(program, icon);
    });
    if (initial) {
      this.lastProgram = initial;
    }
  }

  async stopListening() {
    this._isTracking = false;
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
