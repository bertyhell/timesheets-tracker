import { TimelineType } from '../Timeline.types';

/**
 * Human readable names for the timeline types. As with the condition variables, the enum is API
 * contract and the label is what the user reads, so the two are kept apart.
 *
 * Only the types whose enum value reads badly are listed; everything else falls through to the
 * value itself, which is already the name people use for it.
 */
const TIMELINE_TYPE_LABELS: Partial<Record<TimelineType, string>> = {
  [TimelineType.FileEdit]: 'File edits webstorm',
};

export function timelineTypeLabel(timelineType: TimelineType | string): string {
  return TIMELINE_TYPE_LABELS[timelineType as TimelineType] ?? timelineType;
}
