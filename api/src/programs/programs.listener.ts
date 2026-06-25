import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import ActiveWindow, { type WindowInfo } from '@paymoapp/active-window';

import { logger } from '../shared/logger';

import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-activity.dto';
import { extractIconColor } from './helpers/extract-icon-color';
import {
  WaylandActiveWindow,
  isWayland,
  type WaylandWindowInfo,
} from './helpers/wayland-active-window';

@Injectable()
export class ProgramsListener implements OnApplicationBootstrap {
  private activeWindowSubscriptionId: number;
  private waylandActiveWindow: WaylandActiveWindow | null = null;
  private lastProgram: CreateProgramDto | null = null;

  constructor(@Inject(ProgramsService) private programsService: ProgramsService) {}

  async onApplicationBootstrap() {
    await this.startListening();
  }

  async startListening() {
    if (isWayland()) {
      await this.startTrackingOpenProgramsWayland();
    } else {
      this.startTrackingOpenProgramsDefault();
    }
  }

  async stopListening() {
    if (this.waylandActiveWindow) {
      this.waylandActiveWindow.disconnect();
      this.waylandActiveWindow = null;
    } else {
      ActiveWindow.unsubscribe(this.activeWindowSubscriptionId);
    }
    this.lastProgram = null;
  }

  /**
   * Tracks active windows on Linux wayland
   * This does require an extra gnome extension to be installed during the installation of the program
   * https://extensions.gnome.org/extension/5592/focused-window-d-bus
   * @private
   */
  private async startTrackingOpenProgramsWayland() {
    this.waylandActiveWindow = new WaylandActiveWindow();

    const initial = await this.waylandActiveWindow.connect();
    if (initial) {
      this.lastProgram = this.waylandWindowToProgram(initial);
    }

    this.waylandActiveWindow.on('window-changed', async (windowInfo: WaylandWindowInfo) => {
      const currentProgram = this.waylandWindowToProgram(windowInfo);
      await this.handleProgramChange(currentProgram, () => {
        logger.info(`changed application: ${windowInfo.title},,${windowInfo.wm_class},,`);
      });
    });
  }

  /**
   * Tracks active window using @paymoapp/active-window for Windows, macOS and Linux x11
   * @private
   */
  private startTrackingOpenProgramsDefault() {
    ActiveWindow.initialize();

    if (!ActiveWindow.requestPermissions()) {
      console.error(
        'Error: You need to grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording'
      );
      process.exit(0);
    }

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

        const { icon, ...info } = windowInfo;
        await this.handleProgramChange(
          currentProgram,
          () => {
            logger.info(`changed application: ${info.title},,${info.application},,${info.path}`);
          },
          icon ?? (null as string | null)
        );
      }
    );
  }

  private waylandWindowToProgram(windowInfo: WaylandWindowInfo): CreateProgramDto {
    return {
      programName: windowInfo.wm_class,
      windowTitle: windowInfo.title,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
    };
  }

  private async handleProgramChange(
    currentProgram: CreateProgramDto,
    logFn: () => void,
    icon: string | null = null
  ) {
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

    logFn();
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
