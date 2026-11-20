import type * as dbus from 'dbus-next';

import { logger } from '../../shared/logger';
import { safeSessionBus, safeSystemBus } from '../../shared/safe-dbus';

export type ActivitySignal = 'locked' | 'unlocked' | 'sleeping' | 'resumed';

/**
 * Subscribes to Linux D-Bus signals that change the active state immediately instead of waiting
 * for the next poll: GNOME screen lock (org.gnome.ScreenSaver.ActiveChanged) and suspend /
 * resume (org.freedesktop.login1.Manager.PrepareForSleep).
 *
 * Every subscription is optional: when a bus or service isn't there (other desktops, macOS,
 * Windows, containers) it's skipped and polling still covers it.
 * Returns a function that unsubscribes and closes the buses.
 */
export async function watchActivitySignals(
  onSignal: (signal: ActivitySignal) => void
): Promise<() => void> {
  const buses: dbus.MessageBus[] = [];
  if (process.platform !== 'linux') {
    return () => {};
  }

  try {
    const bus = safeSessionBus();
    buses.push(bus);
    const obj = await bus.getProxyObject('org.gnome.ScreenSaver', '/org/gnome/ScreenSaver');
    const iface = obj.getInterface('org.gnome.ScreenSaver');
    iface.on('ActiveChanged', (active: boolean) => onSignal(active ? 'locked' : 'unlocked'));
    logger.info('active state: listening for GNOME screen lock changes');
  } catch {
    // Not running GNOME
  }

  try {
    const bus = safeSystemBus();
    buses.push(bus);
    const obj = await bus.getProxyObject('org.freedesktop.login1', '/org/freedesktop/login1');
    const iface = obj.getInterface('org.freedesktop.login1.Manager');
    iface.on('PrepareForSleep', (sleeping: boolean) => onSignal(sleeping ? 'sleeping' : 'resumed'));
    logger.info('active state: listening for suspend/resume');
  } catch {
    // No systemd-logind
  }

  return () => {
    for (const bus of buses) {
      try {
        bus.disconnect();
      } catch {
        // already closed
      }
    }
  };
}
