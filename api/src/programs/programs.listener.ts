import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import ActiveWindow, { type WindowInfo } from '@paymoapp/active-window';

import { logger } from '../shared/logger';

import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-activity.dto';

@Injectable()
export class ProgramsListener implements OnApplicationBootstrap {
  private activeWindowSubscriptionId: number;
  private lastProgram: CreateProgramDto | null = null;

  constructor(@Inject(ProgramsService) private programsService: ProgramsService) {}

  async onApplicationBootstrap() {
    await this.startListening();
  }

  async startListening() {
    ActiveWindow.initialize();

    if (!ActiveWindow.requestPermissions()) {
      console.error(
        'Error: You need to grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording'
      );
      process.exit(0);
    }

    this.startTrackingOpenPrograms();
  }

  async stopListening() {
    ActiveWindow.unsubscribe(this.activeWindowSubscriptionId);
    this.lastProgram = null;
  }

  private startTrackingOpenPrograms() {
    this.activeWindowSubscriptionId = ActiveWindow.subscribe(
      async (windowInfo: WindowInfo | null) => {
        if (!windowInfo) {
          return;
        }
        const currentProgram: CreateProgramDto = {
          programName: windowInfo.application,
          windowTitle: windowInfo.title,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        };

        if (!this.lastProgram) {
          this.lastProgram = currentProgram;
        } else if (
          // If same program and title, ignore entry
          (this.lastProgram.programName === currentProgram.programName &&
            this.lastProgram.windowTitle === currentProgram.windowTitle) ||
          // If windows explorer en no title, ignore entry
          (currentProgram.programName === 'Windows Explorer' && currentProgram.windowTitle === '')
        ) {
          // ignore entry since it's the same activity as this.lastProgram
        } else {
          // Program changes, write last activity to database
          const { icon: _icon, ...info } = windowInfo;
          logger.info(
            'changed application or title: ',
            new Date().toISOString(),
            JSON.stringify(info)
          );
          await this.programsService.create({
            programName: this.lastProgram.programName,
            windowTitle: this.lastProgram.windowTitle,
            startedAt: this.lastProgram.startedAt,
            endedAt: currentProgram.startedAt,
          });
          this.lastProgram = currentProgram;
        }
      }
    );
  }
}
