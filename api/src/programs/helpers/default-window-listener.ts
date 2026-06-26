import ActiveWindow, { type WindowInfo } from '@paymoapp/active-window';

import { logger } from '../../shared/logger';
import { CreateProgramDto } from '../dto/create-activity.dto';
import { type IWindowListener, type WindowChangeEvent } from './window-listener.types';

export class DefaultWindowListener implements IWindowListener {
  private subscriptionId: number;

  async start(
    onWindowChange: (event: WindowChangeEvent) => Promise<void>
  ): Promise<CreateProgramDto | null> {
    ActiveWindow.initialize();

    if (!ActiveWindow.requestPermissions()) {
      console.error(
        'Error: You need to grant screen recording permission in System Preferences > Security & Privacy > Privacy > Screen Recording'
      );
      process.exit(0);
    }

    this.subscriptionId = ActiveWindow.subscribe(async (windowInfo: WindowInfo | null) => {
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
    ActiveWindow.unsubscribe(this.subscriptionId);
  }
}
