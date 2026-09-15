import { DefaultWindowListener } from './default-window-listener';
import { isWayland } from './wayland-active-window';
import { WaylandWindowListener } from './wayland-window-listener';
import { type IWindowListener } from './window-listener.types';

export function createWindowListener(): IWindowListener {
  return isWayland() ? new WaylandWindowListener() : new DefaultWindowListener();
}
