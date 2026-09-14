// `import util = require('util')` rather than `import * as util`: the latter compiles to
// `__importStar(require('util'))`, which copies the namespace into a fresh object, so patching it
// would leave the real `util` exports — the ones usocket reads — untouched.
import util = require('util');

/**
 * Node 23 removed the long-deprecated `util.isError`, but usocket still calls it. usocket is
 * dbus-next's unix-socket transport, and dbus-next is how the service reads the focused window and
 * the idle state on Wayland, so the very first DBus handshake takes the whole process down with a
 * TypeError on any current Node version.
 *
 * The real `util.isError` also recognised Errors from other realms; `instanceof` is enough here,
 * because usocket only ever tests a value its own native binding just returned.
 *
 * This module is imported for its side effect alone, and has to stay the first import of the
 * bootstrap so the shim is in place before dbus-next is pulled in.
 */
if (typeof (util as Record<string, unknown>).isError !== 'function') {
  (util as Record<string, unknown>).isError = (value: unknown) => value instanceof Error;
}
