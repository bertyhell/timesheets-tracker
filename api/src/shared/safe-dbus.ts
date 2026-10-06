import dbus from 'dbus-next';

/**
 * dbus-next throws synchronously from inside socket event handlers when it tries to reply to an
 * incoming message after the stream has closed (e.g. right after `bus.disconnect()`, or while the
 * session bus is still coming up during OS boot). That throw is uncaught and kills the process.
 * These wrappers swallow those late sends and forward stream errors to a listener instead.
 */
function makeSafe(bus: dbus.MessageBus, label: string): dbus.MessageBus {
  bus.on('error', (error: Error) => {
    console.warn(`D-Bus ${label} bus error:`, error?.message ?? error);
  });

  const originalSend = bus.send.bind(bus);
  (bus as any).send = (msg: dbus.Message) => {
    try {
      return originalSend(msg);
    } catch (error) {
      console.warn(`D-Bus ${label} bus send failed:`, (error as Error)?.message ?? error);
    }
  };

  return bus;
}

export function safeSessionBus(): dbus.MessageBus {
  return makeSafe(dbus.sessionBus(), 'session');
}

export function safeSystemBus(): dbus.MessageBus {
  return makeSafe(dbus.systemBus(), 'system');
}
