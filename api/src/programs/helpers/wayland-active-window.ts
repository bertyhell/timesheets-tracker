import { EventEmitter } from 'events';
import dbus from 'dbus-next';

const DBUS_DEST = 'org.gnome.Shell';
const DBUS_PATH = '/org/gnome/shell/extensions/FocusedWindow';
const DBUS_IFACE = 'org.gnome.shell.extensions.FocusedWindow';

export interface WaylandWindowInfo {
  title: string;
  wm_class: string;
  pid: number;
}

/**
 * Event-driven active window tracker for GNOME Wayland via the
 * focused-window-dbus extension (https://github.com/flexagoon/focused-window-dbus).
 *
 * Emits a 'window-changed' event with a WaylandWindowInfo payload whenever
 * the focused window changes, subscribing to the DBus FocusChanged signal —
 * no polling involved.
 */
export class WaylandActiveWindow extends EventEmitter {
  private bus: dbus.MessageBus | null = null;
  private iface: dbus.ClientInterface | null = null;

  async connect(): Promise<WaylandWindowInfo | null> {
    try {
      this.bus = dbus.sessionBus();
      const obj = await this.bus.getProxyObject(DBUS_DEST, DBUS_PATH);
      this.iface = obj.getInterface(DBUS_IFACE);

      this.iface.on('FocusChanged', (windowJson: string) => {
        try {
          const win: WaylandWindowInfo = JSON.parse(windowJson);
          this.emit('window-changed', win);
        } catch {
          // Malformed JSON from extension — ignore
        }
      });

      // Return the currently focused window as the initial state
      const current = await (this.iface as any).Get();
      return JSON.parse(current) as WaylandWindowInfo;
    } catch (error) {
      console.error(
        'Failed to connect to focused-window-dbus extension. ' +
          'Make sure the GNOME extension is installed and enabled.',
        error
      );
      return null;
    }
  }

  disconnect() {
    if (this.iface) {
      this.iface.removeAllListeners('FocusChanged');
      this.iface = null;
    }
    if (this.bus) {
      this.bus.disconnect();
      this.bus = null;
    }
  }
}

/** Returns true when the current session is running on Wayland. */
export function isWayland(): boolean {
  return (
    process.platform === 'linux' &&
    (process.env.WAYLAND_DISPLAY != null || process.env.XDG_SESSION_TYPE === 'wayland')
  );
}
