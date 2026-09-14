import { parseISO } from 'date-fns';
import type { TimelineDto, TimelineEventDto } from '../../../generated/api/types.gen';
import { getColorForEvent, getDarkerTextColor } from './getColorForEvent';
import { getEventLabel } from './getEventLabel';

/**
 * A timeline event with everything the render loop needs already worked out.
 *
 * A busy day holds several thousand events per timeline, and zooming or panning restyles every
 * single bar. Anything derived here is derived once per data load instead of once per bar per
 * wheel tick, which keeps the render loop down to plain arithmetic.
 */
export interface PreparedEvent extends TimelineEventDto {
  startMs: number;
  endMs: number;
  /** Text shown on the bar itself. */
  label: string;
  color: string;
  /** Readable-on-the-bar variant of `color`, used for the label text. */
  textColor: string;
  /** "HH:mm - HH:mm", shown next to the label on wide bars. */
  timeRange: string;
  /** Lowercased haystack for the search dimming, so that check is a plain substring test. */
  haystack: string;
  /**
   * The events this bar stands in for, when neighbouring events were too close together to tell
   * apart at the current zoom. Absent on bars that represent a single event.
   */
  mergedFrom?: PreparedEvent[];
}

/** date-fns `format(date, 'HH:mm')`, without the parsing and locale machinery. */
export function formatHoursMinutes(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
}

export function formatTimeRange(startMs: number, endMs: number): string {
  return formatHoursMinutes(new Date(startMs)) + ' - ' + formatHoursMinutes(new Date(endMs));
}

/**
 * Sorted by start time, so the render loop can walk neighbours without sorting again.
 */
export function prepareEvents(
  timelineInfo: TimelineDto,
  events: TimelineEventDto[]
): PreparedEvent[] {
  const prepared = events.map((event): PreparedEvent => {
    const startMs = parseISO(event.startedAt).getTime();
    const endMs = parseISO(event.endedAt).getTime();
    const color = getColorForEvent(timelineInfo, event);
    return {
      ...event,
      startMs,
      endMs,
      label: getEventLabel(timelineInfo, event),
      color,
      textColor: getDarkerTextColor(color),
      timeRange: formatTimeRange(startMs, endMs),
      haystack: JSON.stringify(event).toLowerCase(),
    };
  });
  prepared.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  return prepared;
}
