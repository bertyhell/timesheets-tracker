/**
 * Native activity tracking (active-window capture, idle-state polling) touches OS-level
 * APIs that aren't available in headless/CI environments and can crash the process there.
 * Set DISABLE_ACTIVITY_TRACKING=true (e.g. for e2e tests) to skip it.
 */
export function isActivityTrackingDisabled(): boolean {
  return process.env.DISABLE_ACTIVITY_TRACKING === 'true';
}
