import type ActiveWindowType from '@paymoapp/active-window';

import { logger } from '../../shared/logger';
import { CreateProgramDto } from '../dto/create-activity.dto';
import { type IWindowListener, type WindowChangeEvent } from './window-listener.types';

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

    if (!this.activeWindow.requestPermissions()) {
      console.error(
        'Error: You need to grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording'
      );
      process.exit(0);
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
