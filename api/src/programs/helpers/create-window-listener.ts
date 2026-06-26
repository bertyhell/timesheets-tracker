import { DefaultWindowListener } from './default-window-listener';
import { WaylandWindowListener } from './wayland-window-listener';
import { isWayland } from './wayland-active-window';
import { type IWindowListener } from './window-listener.types';

export function createWindowListener(): IWindowListener {
  return isWayland() ? new WaylandWindowListener() : new DefaultWindowListener();
}
