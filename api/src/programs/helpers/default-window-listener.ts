import type ActiveWindowType from '@paymoapp/active-window';

import { logger } from '../../shared/logger';
import { CreateProgramDto } from '../dto/create-activity.dto';
import { type IWindowListener, type WindowChangeEvent } from './window-listener.types';

export class MissingScreenRecordingPermissionError extends Error {
  constructor() {
    super(
      'Screen recording permission is not granted. Activity tracking is disabled. ' +
        'Grant it in System Settings > Privacy & Security > Screen Recording and restart the app.'
    );
    this.name = 'MissingScreenRecordingPermissionError';
  }
}

export class DefaultWindowListener implements IWindowListener {
  private subscriptionId: number;
  // Lazily loaded to avoid crashing headless environments at module init time.
  private activeWindow: typeof ActiveWindowType | null = null;

  async start(
    onWindowChange: (event: WindowChangeEvent) => Promise<void>
  ): Promise<CreateProgramDto | null> {
    const mod = await import('@paymoapp/active-window');
    this.activeWindow = mod.default;

    this.activeWindow.initialize({ osxRunLoop: 'all' });

    // Never exit the process here: this listener runs inside the API server, which
    // also serves the UI. Killing it over a missing permission leaves the Electron
    // shell waiting forever for a server that will never listen — a window-less app
    // with no visible error. Degrade instead: no activity tracking, everything else works.
    if (!this.activeWindow.requestPermissions()) {
      throw new MissingScreenRecordingPermissionError();
    }

    this.subscriptionId = this.activeWindow.subscribe(async (windowInfo) => {
      if (!windowInfo) {
        return;
      }

      const { icon, ...info } = windowInfo;
      logger.info(`changed application: ${info.title},,${info.application},,${info.path}`);

      await onWindowChange({
        program: {
          programName: windowInfo.application,
          windowTitle: windowInfo.title,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        },
        icon: icon ?? null,
      });
    });

    return null;
  }

  stop(): void {
    this.activeWindow?.unsubscribe(this.subscriptionId);
    this.activeWindow = null;
  }
}
