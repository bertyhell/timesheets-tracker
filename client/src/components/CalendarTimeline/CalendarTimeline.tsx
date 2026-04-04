import React from 'react';
import { endOfDay, startOfDay } from 'date-fns';
import { useAtom } from 'jotai/index';
import { useCalendarsServiceCalendarsControllerGetEvents } from '../../generated/api/queries';
import { type CalendarDto } from '../../generated/api/requests/types.gen';
import { type TimelineEvent, TimelineType } from '../Timeline/Timeline.types';
import Timeline from '../Timeline/Timeline';
import type { TagName } from '../../types/types';
import { viewDateAtom } from '../../store/store';

interface CalendarTimelineProps {
  calendar: CalendarDto;
  minTime: Date;
  maxTime: Date;
  onMouseDown: (posX: number) => void;
  onMouseMove: (posX: number) => void;
  onMouseUp: (posX: number) => void;
  selectionPercentages: { start: number; end: number } | null;
  onCreateTagName: (name: string) => Promise<TagName>;
  onCreateTag: (tagNameId: string) => Promise<void>;
  selectedEvent: TimelineEvent | null;
  setSelectedEvent: (event: TimelineEvent) => void;
}

function CalendarTimeline({
  calendar,
  minTime,
  maxTime,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  selectionPercentages,
  onCreateTagName,
  onCreateTag,
  selectedEvent,
  setSelectedEvent,
}: CalendarTimelineProps) {
  const [viewDate] = useAtom(viewDateAtom);

  const { data: rawEvents } = useCalendarsServiceCalendarsControllerGetEvents({
    id: calendar.id,
    start: startOfDay(viewDate).toISOString(),
    end: endOfDay(viewDate).toISOString(),
  });

  const calendarEvents: TimelineEvent[] = ((rawEvents as any[]) || []).map((event) => ({
    id: event.id,
    info: {
      ...(event.summary ? { summary: event.summary } : {}),
      ...(event.location ? { location: event.location } : {}),
    },
    color: calendar.color,
    startedAt: event.allDay ? startOfDay(viewDate) : new Date(event.start),
    endedAt: event.allDay ? endOfDay(viewDate) : new Date(event.end),
    type: TimelineType.Calendar,
  }));

  return (
    <Timeline
      name={calendar.title}
      events={calendarEvents}
      minTime={minTime}
      maxTime={maxTime}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      selectionPercentages={selectionPercentages}
      onCreateTagName={onCreateTagName}
      onCreateTag={onCreateTag}
      selectedEvent={selectedEvent}
      setSelectedEvent={setSelectedEvent}
    />
  );
}

export default CalendarTimeline;
