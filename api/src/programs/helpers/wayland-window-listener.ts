import { logger } from '../../shared/logger';
import { CreateProgramDto } from '../dto/create-activity.dto';
import { WaylandActiveWindow, type WaylandWindowInfo } from './wayland-active-window';
import { type IWindowListener, type WindowChangeEvent } from './window-listener.types';

export class WaylandWindowListener implements IWindowListener {
  private waylandActiveWindow: WaylandActiveWindow | null = null;

  async start(
    onWindowChange: (event: WindowChangeEvent) => Promise<void>
  ): Promise<CreateProgramDto | null> {
    this.waylandActiveWindow = new WaylandActiveWindow();
    const initial = await this.waylandActiveWindow.connect();

    this.waylandActiveWindow.on('window-changed', async (windowInfo: WaylandWindowInfo) => {
      logger.info(`changed application: ${windowInfo.title},,${windowInfo.wm_class},,`);
      await onWindowChange({
        program: {
          programName: windowInfo.wm_class,
          windowTitle: windowInfo.title,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        },
        icon: null,
      });
    });

    return initial
      ? {
          programName: initial.wm_class,
          windowTitle: initial.title,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        }
      : null;
  }

  stop(): void {
    this.waylandActiveWindow?.disconnect();
    this.waylandActiveWindow = null;
  }
}
