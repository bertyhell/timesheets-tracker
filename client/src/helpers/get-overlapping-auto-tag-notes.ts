import { parseISO } from 'date-fns';
import type { AutoTagEventInfoDto, TimelineWithEventsDto } from '../generated/api/types.gen';

/**
 * Collects the notes of all auto tag events that overlap the given time range.
 * Used to copy those notes onto a newly created tag, so the user does not have to retype them.
 * Notes are returned in chronological order, without duplicates and without empty entries.
 */
export function getOverlappingAutoTagNotes(
  timelinesWithEvents: TimelineWithEventsDto[] | undefined,
  startedAt: Date,
  endedAt: Date
): string[] {
  const rangeStart = Math.min(startedAt.getTime(), endedAt.getTime());
  const rangeEnd = Math.max(startedAt.getTime(), endedAt.getTime());
  const notes: string[] = [];

  (timelinesWithEvents ?? [])
    .filter((timelineWithEvents) => timelineWithEvents.type === 'AutoTag')
    .flatMap((timelineWithEvents) => timelineWithEvents.events)
    .filter((event) => {
      // Overlap, not just touching: an auto tag that ends exactly where the tag starts is not included
      return (
        parseISO(event.startedAt).getTime() < rangeEnd &&
        parseISO(event.endedAt).getTime() > rangeStart
      );
    })
    .sort((eventA, eventB) => eventA.startedAt.localeCompare(eventB.startedAt))
    .forEach((event) => {
      const note = (event.info as AutoTagEventInfoDto).tagNameNote?.trim();
      if (note && !notes.includes(note)) {
        notes.push(note);
      }
    });

  return notes;
}
