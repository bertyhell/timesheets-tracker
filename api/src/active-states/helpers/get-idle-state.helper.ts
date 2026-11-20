import RealIdle, { IdleState } from '@paymoapp/real-idle';
import * as dbus from 'dbus-next';

import { safeSessionBus, safeSystemBus } from '../../shared/safe-dbus';

export interface ActivitySnapshot {
  /** True when the user is using the computer: not idle past the threshold and not locked. */
  isActive: boolean;
  /**
   * When the user stopped being active (epoch ms), if the OS can tell: the moment of the last
   * input or the moment the screen locked. Used to back-date the start of an away period.
   */
  inactiveSince?: number;
}

const IDLE_STATE_TO_IS_ACTIVE: Record<string, boolean> = {
  [IdleState.active]: true,
  [IdleState.idlePrevented]: true,
  [IdleState.idle]: false,
  [IdleState.locked]: false,
  [IdleState.unknown]: false,
};

export function isLinuxWayland(): boolean {
  return (
    process.platform === 'linux' &&
    (!!process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === 'wayland')
  );
}

/**
 * Returns whether the user is active, treating a locked screen or input idle for at least
 * thresholdSeconds as inactive. On Linux Wayland RealIdle returns "unknown", so we query
 * GNOME / systemd-logind over D-Bus instead.
 */
export async function getActivitySnapshot(thresholdSeconds: number): Promise<ActivitySnapshot> {
  if (isLinuxWayland()) {
    return getActivitySnapshotWayland(thresholdSeconds);
  }
  const now = Date.now();
  const idleState = RealIdle.getIdleState(thresholdSeconds);
  const isActive = IDLE_STATE_TO_IS_ACTIVE[idleState] ?? false;
  if (idleState === IdleState.idle) {
    return { isActive, inactiveSince: now - RealIdle.getIdleSeconds() * 1000 };
  }
  return { isActive };
}

async function getActivitySnapshotWayland(thresholdSeconds: number): Promise<ActivitySnapshot> {
  const now = Date.now();

  // A locked screen always means away, even when someone just moved the mouse on the lock screen.
  const lockedSince = await getLockedSince(now);
  if (lockedSince !== null) {
    return { isActive: false, inactiveSince: lockedSince };
  }

  const idleSince = await getIdleSince(now);
  if (idleSince === undefined) {
    // No way to tell; keep the old behaviour of reporting inactive.
    return { isActive: false };
  }
  if (now - idleSince >= thresholdSeconds * 1000) {
    return { isActive: false, inactiveSince: idleSince };
  }
  return { isActive: true };
}

/**
 * Returns when the screen was locked (epoch ms), `now` when locked but the lock time is unknown,
 * or null when not locked / unknown.
 */
async function getLockedSince(now: number): Promise<number | null> {
  // GNOME Shell: reflects the lock screen immediately
  try {
    const bus = safeSessionBus();
    try {
      const obj = await bus.getProxyObject('org.gnome.ScreenSaver', '/org/gnome/ScreenSaver');
      const iface = obj.getInterface('org.gnome.ScreenSaver');
      const active: boolean = await iface.GetActive();
      if (!active) return null;
      const activeSeconds: number = await iface.GetActiveTime().catch(() => 0);
      return activeSeconds > 0 ? now - activeSeconds * 1000 : now;
    } finally {
      bus.disconnect();
    }
  } catch {
    // not GNOME, try logind
  }

  try {
    const props = await getLogindSessionProps();
    try {
      const locked: dbus.Variant<boolean> = await props.iface.Get(
        'org.freedesktop.login1.Session',
        'LockedHint'
      );
      return locked.value ? now : null;
    } finally {
      props.bus.disconnect();
    }
  } catch {
    return null;
  }
}

/** Returns the time of the last user input (epoch ms), or undefined when unknown. */
async function getIdleSince(now: number): Promise<number | undefined> {
  // GNOME Mutter IdleMonitor: precise milliseconds since last input
  try {
    const bus = safeSessionBus();
    try {
      const obj = await bus.getProxyObject(
        'org.gnome.Mutter.IdleMonitor',
        '/org/gnome/Mutter/IdleMonitor/Core'
      );
      const iface = obj.getInterface('org.gnome.Mutter.IdleMonitor');
      const idleTimeMs: bigint = await iface.GetIdletime();
      return now - Number(idleTimeMs);
    } finally {
      bus.disconnect();
    }
  } catch {
    // not GNOME, try logind
  }

  // systemd-logind IdleHint / IdleSinceHint (set by the compositor after its own idle delay)
  try {
    const props = await getLogindSessionProps();
    try {
      const idle: dbus.Variant<boolean> = await props.iface.Get(
        'org.freedesktop.login1.Session',
        'IdleHint'
      );
      if (!idle.value) return now;
      const idleSinceUs: dbus.Variant<bigint> = await props.iface.Get(
        'org.freedesktop.login1.Session',
        'IdleSinceHint'
      );
      const idleSince = Number(idleSinceUs.value / 1000n);
      return idleSince > 0 ? idleSince : 0;
    } finally {
      props.bus.disconnect();
    }
  } catch {
    return undefined;
  }
}

async function getLogindSessionProps(): Promise<{
  bus: dbus.MessageBus;
  iface: dbus.ClientInterface;
}> {
  const bus = safeSystemBus();
  try {
    // /session/auto resolves to the caller's current session (systemd 230+)
    const obj = await bus.getProxyObject(
      'org.freedesktop.login1',
      '/org/freedesktop/login1/session/auto'
    );
    return { bus, iface: obj.getInterface('org.freedesktop.DBus.Properties') };
  } catch (err) {
    bus.disconnect();
    throw err;
  }
}
