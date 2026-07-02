import RealIdle, { IdleState } from '@paymoapp/real-idle';
import * as dbus from 'dbus-next';
import { logger } from '../../shared/logger';

const IDLE_STATE_TO_IS_ACTIVE: Record<string, boolean> = {
  [IdleState.active]: true,
  [IdleState.idlePrevented]: true,
  [IdleState.idle]: false,
  [IdleState.locked]: false,
  [IdleState.unknown]: false,
};

function isLinuxWayland(): boolean {
  return (
    process.platform === 'linux' &&
    (!!process.env.WAYLAND_DISPLAY || process.env.XDG_SESSION_TYPE === 'wayland')
  );
}

/**
 * Returns true when the user is considered active, false when idle/locked/unknown.
 * On Linux Wayland, RealIdle returns "unknown" so we fall back to D-Bus queries.
 */
export async function getIsActive(thresholdSeconds: number): Promise<boolean> {
  if (isLinuxWayland()) {
    return getIsActiveWayland(thresholdSeconds);
  }
  const idleState = RealIdle.getIdleState(thresholdSeconds);
  return IDLE_STATE_TO_IS_ACTIVE[idleState] ?? false;
}

async function getIsActiveWayland(thresholdSeconds: number): Promise<boolean> {
  // Primary: GNOME Mutter IdleMonitor — precise millisecond idle time
  try {
    return await getIsActiveViaGnomeMutter(thresholdSeconds);
  } catch {
    // ignore errors
  }

  // Fallback: systemd-logind IdleHint / LockedHint properties
  try {
    return await getIsActiveViaLogind();
  } catch (err) {
    // ignore errors
    return false;
  }
}

async function getIsActiveViaGnomeMutter(thresholdSeconds: number): Promise<boolean> {
  const bus = dbus.sessionBus();
  try {
    const obj = await bus.getProxyObject(
      'org.gnome.Mutter.IdleMonitor',
      '/org/gnome/Mutter/IdleMonitor/Core'
    );
    const iface = obj.getInterface('org.gnome.Mutter.IdleMonitor');
    // GetIdletime() returns a uint64 (BigInt) of milliseconds since last input
    const [idleTimeMs]: [bigint] = await iface.GetIdletime();
    return Number(idleTimeMs) < thresholdSeconds * 1000;
  } finally {
    bus.disconnect();
  }
}

async function getIsActiveViaLogind(): Promise<boolean> {
  const bus = dbus.systemBus();
  try {
    // /session/auto resolves to the caller's current session (systemd 230+)
    const obj = await bus.getProxyObject(
      'org.freedesktop.login1',
      '/org/freedesktop/login1/session/auto'
    );
    const props = obj.getInterface('org.freedesktop.DBus.Properties');

    const lockedVariant: dbus.Variant<boolean> = await props.Get(
      'org.freedesktop.login1.Session',
      'LockedHint'
    );
    if (lockedVariant.value) return false;

    const idleVariant: dbus.Variant<boolean> = await props.Get(
      'org.freedesktop.login1.Session',
      'IdleHint'
    );
    return !idleVariant.value;
  } finally {
    bus.disconnect();
  }
}
