import { parseISO } from 'date-fns';

import type { AutoTagEventInfoDto, TimelineEventDto } from '../../../generated/api/types.gen';

/** Outer limits the grown auto tags have to stay inside, in epoch milliseconds. */
export interface GrowBounds {
  minMs: number;
  maxMs: number;
}

export interface GrowOptions {
  /** Most a single auto tag may gain on each of its sides. */
  maxGrowMs: number;
  /** Earliest start and latest end the grown tags may reach, or null to leave them unbounded. */
  bounds: GrowBounds | null;
  /**
   * Which tag names may grow, looked up per event. The tag names are read straight from their own
   * endpoint rather than from the day's events, so toggling one shows up without reloading the day.
   * Falls back to the flag the event carries for a tag name that is not in the map.
   */
  canGrowByTagNameId?: Map<string, boolean>;
}

/** An auto tag event with the bounds it would have after growing, next to the ones it has now. */
export interface GrownAutoTagEvent {
  event: TimelineEventDto;
  startMs: number;
  endMs: number;
  originalStartMs: number;
  originalEndMs: number;
  /** Whether the tag name behind this event allows it to grow at all. */
  canGrow: boolean;
}

/** An interval is only worth turning into a tag once it lasts at least this long. */
export const MIN_TAG_DURATION_MS = 60 * 1000;

export interface Interval {
  startMs: number;
  endMs: number;
}

/**
 * Stretches auto tags into the free time around them.
 *
 * Every auto tag whose tag name is marked as growable reaches out by at most `maxGrowMs` on each
 * side. It stops as soon as it meets its neighbour: when both neighbours may grow they meet in the
 * middle of the gap, when only one may, that one takes the whole gap. The outermost edges stop at
 * `bounds`. Growing never shrinks an auto tag, so a tag that already reaches outside the bounds
 * keeps the reach it has.
 *
 * The result is sorted by start time.
 */
export function growAutoTagEvents(
  events: TimelineEventDto[],
  { maxGrowMs, bounds, canGrowByTagNameId }: GrowOptions
): GrownAutoTagEvent[] {
  const grown: GrownAutoTagEvent[] = events
    .map((event) => {
      const originalStartMs = parseISO(event.startedAt).getTime();
      const originalEndMs = parseISO(event.endedAt).getTime();
      const info = event.info as AutoTagEventInfoDto;
      return {
        event,
        startMs: originalStartMs,
        endMs: originalEndMs,
        originalStartMs,
        originalEndMs,
        canGrow: canGrowByTagNameId?.get(info?.tagNameId) ?? !!info?.tagNameCanGrow,
      };
    })
    .sort((a, b) => a.originalStartMs - b.originalStartMs || a.originalEndMs - b.originalEndMs);

  if (!grown.length || maxGrowMs <= 0) {
    return grown;
  }

  // Outer edges: the free time before the first and after the last auto tag is only limited by the
  // bounds, so there is no neighbour to share it with.
  const first = grown[0];
  if (first.canGrow) {
    const room = bounds ? first.originalStartMs - bounds.minMs : Infinity;
    first.startMs = first.originalStartMs - Math.max(0, Math.min(maxGrowMs, room));
  }
  const last = grown[grown.length - 1];
  if (last.canGrow) {
    const room = bounds ? bounds.maxMs - last.originalEndMs : Infinity;
    last.endMs = last.originalEndMs + Math.max(0, Math.min(maxGrowMs, room));
  }

  // Inner gaps: whoever may grow into a gap takes it, and two growable neighbours split it evenly.
  for (let index = 0; index < grown.length - 1; index++) {
    const current = grown[index];
    const next = grown[index + 1];
    const gapMs = next.originalStartMs - current.originalEndMs;
    if (gapMs <= 0) continue;

    if (current.canGrow && next.canGrow) {
      const share = Math.min(maxGrowMs, gapMs / 2);
      current.endMs = current.originalEndMs + share;
      next.startMs = next.originalStartMs - share;
    } else if (current.canGrow) {
      current.endMs = current.originalEndMs + Math.min(maxGrowMs, gapMs);
    } else if (next.canGrow) {
      next.startMs = next.originalStartMs - Math.min(maxGrowMs, gapMs);
    }
  }

  if (bounds) {
    grown.forEach((entry) => {
      entry.startMs = Math.max(entry.startMs, Math.min(bounds.minMs, entry.originalStartMs));
      entry.endMs = Math.min(entry.endMs, Math.max(bounds.maxMs, entry.originalEndMs));
    });
  }

  return grown;
}

/**
 * The earliest start and latest end across the given events, or null when there are none.
 */
export function getEventBounds(events: TimelineEventDto[]): GrowBounds | null {
  let minMs = Infinity;
  let maxMs = -Infinity;
  events.forEach((event) => {
    minMs = Math.min(minMs, parseISO(event.startedAt).getTime());
    maxMs = Math.max(maxMs, parseISO(event.endedAt).getTime());
  });
  return Number.isFinite(minMs) && Number.isFinite(maxMs) ? { minMs, maxMs } : null;
}

/**
 * What is left of `interval` once every interval in `blockers` is cut out of it.
 * Pieces shorter than `minDurationMs` are dropped rather than handed back as slivers.
 */
export function subtractIntervals(
  interval: Interval,
  blockers: Interval[],
  minDurationMs = MIN_TAG_DURATION_MS
): Interval[] {
  let remaining: Interval[] = [interval];

  blockers.forEach((blocker) => {
    remaining = remaining.flatMap((piece) => {
      if (blocker.endMs <= piece.startMs || blocker.startMs >= piece.endMs) return [piece];
      const parts: Interval[] = [];
      if (blocker.startMs > piece.startMs) {
        parts.push({ startMs: piece.startMs, endMs: blocker.startMs });
      }
      if (blocker.endMs < piece.endMs) {
        parts.push({ startMs: blocker.endMs, endMs: piece.endMs });
      }
      return parts;
    });
  });

  return remaining.filter((piece) => piece.endMs - piece.startMs >= minDurationMs);
}
