import { formatTimeRange, type PreparedEvent } from './prepareEvents';

/**
 * Two bars carrying the same label and separated by less than this many pixels are drawn as one.
 * Below a couple of pixels the seam between them cannot be seen anyway, so splitting them only
 * costs DOM nodes.
 */
const MERGE_GAP_PX = 2;

/**
 * A different activity wedged between two runs of the same activity is swallowed when it is this
 * narrow on screen. A three-second glance at Slack in the middle of an hour in the editor is noise
 * at day zoom; zooming in makes it wider than the threshold and it reappears as its own bar.
 */
const MERGE_INTERRUPTION_PX = 3;

/**
 * Track width to assume before the real one has been measured, so the first paint is not empty.
 */
const ASSUMED_TRACK_WIDTH_PX = 1200;

function mergeGroup(group: PreparedEvent[], endMs: number): PreparedEvent {
  if (group.length === 1) return group[0];

  const first = group[0];
  // The longest event carrying the run's label decides the colour and the info shown in the
  // tooltip, so a merged bar looks like the activity that actually filled the time.
  let primary = first;
  let primaryDuration = -1;
  for (const event of group) {
    const duration = event.endMs - event.startMs;
    if (event.label === first.label && duration > primaryDuration) {
      primaryDuration = duration;
      primary = event;
    }
  }

  return {
    ...primary,
    // Reuse the first event's id so a selection survives zooming, and so clicking a merged bar
    // still refers to an event that exists in the underlying data.
    id: first.id,
    startedAt: first.startedAt,
    endedAt: new Date(endMs).toISOString(),
    startMs: first.startMs,
    endMs,
    timeRange: formatTimeRange(first.startMs, endMs),
    // Keep every source event searchable, so searching for a swallowed event still lights up the
    // bar that hides it.
    haystack: group.map((event) => event.haystack).join(' '),
    mergedFrom: group,
  };
}

/**
 * Drops events outside the visible window and merges the ones too close together to tell apart at
 * the current zoom.
 *
 * Both passes are driven by the visible window, so this runs on every zoom and pan tick — it is
 * deliberately plain arithmetic over an already-sorted array. `events` must come from
 * `prepareEvents`.
 */
export function cullAndMergeEvents(
  events: PreparedEvent[],
  windowStartMs: number,
  windowEndMs: number,
  trackWidthPx: number,
  merge = true
): PreparedEvent[] {
  const windowMs = windowEndMs - windowStartMs;
  if (!events.length || windowMs <= 0) return [];

  const width = trackWidthPx > 0 ? trackWidthPx : ASSUMED_TRACK_WIDTH_PX;
  const msPerPx = windowMs / width;
  const mergeGapMs = MERGE_GAP_PX * msPerPx;
  const interruptionMs = MERGE_INTERRUPTION_PX * msPerPx;

  // The track clips its overflow, so events that fall outside the window are simply dropped —
  // ones that straddle an edge are kept and clipped by the browser.
  const visible: PreparedEvent[] = [];
  for (const event of events) {
    if (event.endMs >= windowStartMs && event.startMs <= windowEndMs) visible.push(event);
  }
  if (!merge || visible.length < 2) return visible;

  const merged: PreparedEvent[] = [];
  let group: PreparedEvent[] = [visible[0]];
  let groupEndMs = visible[0].endMs;

  for (let index = 1; index < visible.length; index++) {
    const event = visible[index];
    const label = group[0].label;

    // The same activity picking up again after an invisible seam
    if (event.label === label && event.startMs - groupEndMs <= mergeGapMs) {
      group.push(event);
      groupEndMs = Math.max(groupEndMs, event.endMs);
      continue;
    }

    // A blip the same activity resumes after: swallow it rather than draw a sliver
    const next = visible[index + 1];
    if (
      next &&
      next.label === label &&
      event.endMs - event.startMs <= interruptionMs &&
      event.startMs - groupEndMs <= mergeGapMs &&
      next.startMs - event.endMs <= mergeGapMs
    ) {
      group.push(event);
      groupEndMs = Math.max(groupEndMs, event.endMs);
      continue;
    }

    merged.push(mergeGroup(group, groupEndMs));
    group = [event];
    groupEndMs = event.endMs;
  }
  merged.push(mergeGroup(group, groupEndMs));

  return merged;
}

export interface MergedBreakdownEntry {
  detail: string;
  durationMs: number;
}

/**
 * What a merged bar is hiding, as a list of the details that differ between its source events.
 *
 * Only the info keys that actually vary inside the group are used, so a run of editor events
 * breaks down by window title rather than repeating the program name every line. Called from the
 * tooltip, so it only ever runs for the bar under the cursor.
 */
export function summarizeMergedEvents(
  events: PreparedEvent[],
  limit = 6
): { entries: MergedBreakdownEntry[]; remaining: number } {
  const valuesByKey = new Map<string, Set<string>>();
  for (const event of events) {
    const info = event.info as Record<string, unknown>;
    for (const key of Object.keys(info)) {
      const value = info[key];
      if (value === '' || value === null || value === undefined) continue;
      if (!valuesByKey.has(key)) valuesByKey.set(key, new Set());
      valuesByKey.get(key)!.add(String(value));
    }
  }
  // Colours and ids vary without telling the user anything
  const varyingKeys = [...valuesByKey.entries()]
    .filter(([key, values]) => values.size > 1 && !/color|^id$|id$/i.test(key))
    .map(([key]) => key);

  const durationByDetail = new Map<string, number>();
  for (const event of events) {
    const info = event.info as Record<string, unknown>;
    const detail = varyingKeys.length
      ? varyingKeys
          .map((key) => info[key])
          .filter((value) => value !== '' && value !== null && value !== undefined)
          .map(String)
          .join(' — ')
      : event.label;
    if (!detail) continue;
    durationByDetail.set(
      detail,
      (durationByDetail.get(detail) ?? 0) + (event.endMs - event.startMs)
    );
  }

  const sorted = [...durationByDetail.entries()]
    .map(([detail, durationMs]): MergedBreakdownEntry => ({ detail, durationMs }))
    .sort((a, b) => b.durationMs - a.durationMs);

  return { entries: sorted.slice(0, limit), remaining: Math.max(0, sorted.length - limit) };
}
