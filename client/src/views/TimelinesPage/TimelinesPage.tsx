import './TimelinesPage.scss';
import { toast } from 'react-toastify';
import React, { useEffect, useState } from 'react';
import Timeline from '../../components/Timeline/Timeline';
import {
  addHours,
  addMilliseconds,
  differenceInMilliseconds,
  endOfDay,
  startOfDay,
  subHours,
} from 'date-fns';
import { type TimelineEvent, TimelineType } from '../../components/Timeline/Timeline.types';
import {
  useActiveStatesServiceActiveStatesControllerFindAll,
  useActivitiesServiceActivitiesControllerFindAll,
  useAutoTagsServiceAutoTagsControllerFindAll,
  useCalendarsServiceCalendarsControllerFindAll,
  useTagNamesServiceTagNamesControllerCount,
  useTagNamesServiceTagNamesControllerCreate,
  useTagsServiceTagsControllerCreate,
  useTagsServiceTagsControllerFindAll,
  useTagsServiceTagsControllerRemove,
  useWebsitesServiceWebsitesControllerFindAll,
} from '../../generated/api/queries';
import type { ActiveState, Activity, AutoTag, Tag, TagName, Website } from '../../types/types';
import { COLOR_LIST } from './TimelinesPage.consts';
import { clamp, maxBy, minBy } from 'lodash-es';
import { calculateAutoTagEvents } from '../../helpers/computeAutoTagEvents';
import { useAtom } from 'jotai';
import { viewDateAtom } from '../../store/store';
import { stringToColorIndex } from '../../helpers/string-to-color-index';
import EventsTable from '../../components/EventsTable/EventsTable';
import { type CalendarDto } from '../../generated/api/requests/types.gen';
import { CalendarsService } from '../../generated/api/requests/services.gen';
import { useQueries } from '@tanstack/react-query';

function TimelinesPage() {
  const [viewDate] = useAtom(viewDateAtom);

  const {
    data: tags,
    isLoading: isLoadingTags,
    refetch: refetchTags,
  } = useTagsServiceTagsControllerFindAll({
    startedAt: startOfDay(viewDate).toISOString(),
    endedAt: endOfDay(viewDate).toISOString(),
  });
  const { data: programs, isLoading: isLoadingPrograms } =
    useActivitiesServiceActivitiesControllerFindAll({
      startedAt: startOfDay(viewDate).toISOString(),
      endedAt: endOfDay(viewDate).toISOString(),
    });
  const { data: websites, isLoading: isLoadingWebsites } =
    useWebsitesServiceWebsitesControllerFindAll({
      startedAt: startOfDay(viewDate).toISOString(),
      endedAt: endOfDay(viewDate).toISOString(),
    });
  const { data: calendars } = useCalendarsServiceCalendarsControllerFindAll();
  const calendarList = (calendars as CalendarDto[]) || [];

  const calendarEventResults = useQueries({
    queries: calendarList.map((calendar) => ({
      queryKey: [
        'CalendarsControllerGetEvents',
        calendar.id,
        startOfDay(viewDate).toISOString(),
        endOfDay(viewDate).toISOString(),
      ],
      queryFn: () =>
        CalendarsService.calendarsControllerGetEvents({
          id: calendar.id,
          startedAt: startOfDay(viewDate).toISOString(),
          endedAt: endOfDay(viewDate).toISOString(),
        }),
    })),
  });

  const getEventsForCalendar = (calendarId: string): TimelineEvent[] => {
    const index = calendarList.findIndex((c) => c.id === calendarId);
    const calendar = calendarList[index];
    const rawEvents = (calendarEventResults[index]?.data as any[]) || [];
    const events = rawEvents.map((event) => {
      return {
        id: event.id,
        info: {
          ...(event.summary ? { summary: event.summary } : {}),
          ...(event.location ? { location: event.location } : {}),
        },
        color: calendar.color,
        startedAt: event.allDay ? startOfDay(viewDate) : new Date(event.start),
        endedAt: event.allDay ? endOfDay(viewDate) : new Date(event.end),
        type: TimelineType.Calendar,
      };
    });
    return events;
  };

  const { data: activeStates, isLoading: isLoadingActiveStates } =
    useActiveStatesServiceActiveStatesControllerFindAll({
      startedAt: startOfDay(viewDate).toISOString(),
      endedAt: endOfDay(viewDate).toISOString(),
    });
  const { data: tagNamesCount, refetch: refetchTagNamesCount } =
    useTagNamesServiceTagNamesControllerCount();
  const { data: allAutoTags, isLoading: isLoadingAllAutoTags } =
    useAutoTagsServiceAutoTagsControllerFindAll({ term: undefined });
  const { mutateAsync: deleteTag } = useTagsServiceTagsControllerRemove();
  const tagEvents = ((tags || []) as Tag[]).map((tag: Tag): TimelineEvent => {
    return {
      id: tag.id,
      info: {
        name: tag.tagName?.title as string,
      },
      color: tag.tagName?.color as string,
      startedAt: new Date(tag.startedAt),
      endedAt: new Date(tag.endedAt),
      type: TimelineType.Tag,
    };
  });
  const programEvents = (programs || []).map((program: Activity): TimelineEvent => {
    return {
      id: program.id,
      info: {
        programName: program.programName,
        windowTitle: program.windowTitle,
      },
      color: COLOR_LIST[stringToColorIndex(program.programName, COLOR_LIST.length)],
      startedAt: new Date(program.startedAt),
      endedAt: new Date(program.endedAt),
      type: TimelineType.Program,
    };
  });
  const websiteEvents = (websites || []).map((website: Website): TimelineEvent => {
    return {
      id: website.id,
      info: {
        websiteTitle: website.websiteTitle,
        websiteUrl: website.websiteUrl,
      },
      color: COLOR_LIST[stringToColorIndex(new URL(website.websiteUrl).host, COLOR_LIST.length)],
      startedAt: new Date(website.startedAt),
      endedAt: new Date(website.endedAt as string),
      type: TimelineType.Program,
    };
  });
  const activeStateEvents = (activeStates || []).map((activeState: ActiveState): TimelineEvent => {
    return {
      id: activeState.id,
      info: {
        state: String(activeState.isActive),
      },
      color: activeState.isActive ? '#00FF00' : '#FF0000',
      startedAt: new Date(activeState.startedAt),
      endedAt: new Date(activeState.endedAt),
      type: TimelineType.Program,
    };
  });
  const [autoTagEvents, setAutoTagEvents] = useState<TimelineEvent[]>([]);

  const { mutateAsync: createTagName } = useTagNamesServiceTagNamesControllerCreate();
  const { mutateAsync: createTag } = useTagsServiceTagsControllerCreate();

  const [selectionStartPercent, setSelectionStartPercent] = useState<number | null>(null);
  const [selectionMovePercent, setSelectionMovePercent] = useState<number | null>(null);
  const [selectionEndPercent, setSelectionEndPercent] = useState<number | null>(null);
  const [activeSelectionTimeline, setActiveSelectionTimeline] = useState<string | null>(null);

  const [selectedTimeline, setSelectedTimeline] = useState<TimelineType>(TimelineType.Program);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const allEvents = [...programEvents, ...websiteEvents];
  const minTime = subHours(
    minBy(allEvents, (event: TimelineEvent) => event.startedAt.getTime())?.startedAt ||
      startOfDay(new Date()),
    1
  );
  const maxTime = addHours(
    maxBy(allEvents, (event: TimelineEvent) => event.endedAt.getTime())?.endedAt ||
      endOfDay(new Date()),
    1
  );
  const windowInMilliseconds = differenceInMilliseconds(maxTime, minTime);
  const selectionStartTime = addMilliseconds(
    minTime,
    (windowInMilliseconds / 100) * (selectionStartPercent || 0)
  );
  const selectionEndTime = addMilliseconds(
    minTime,
    (windowInMilliseconds / 100) * (selectionEndPercent || 0)
  );

  const timelineEvents: Record<TimelineType, (id?: string) => TimelineEvent[]> = {
    [TimelineType.Tag]: () => tagEvents,
    [TimelineType.AutoTag]: () => autoTagEvents,
    [TimelineType.Active]: () => activeStateEvents,
    [TimelineType.Program]: () => programEvents,
    [TimelineType.Website]: () => websiteEvents,
    [TimelineType.Calendar]: (calendarId: string) => {
      const calendarIndex = calendarList.findIndex((calendar) => calendar.id === calendarId);
      return calendarEventResults[calendarIndex].data;
    },
  };

  useEffect(() => {
    document.addEventListener('keyup', handleKeyUpEvent);

    return () => {
      document.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, []);

  useEffect(() => {
    if (
      !isLoadingPrograms &&
      !isLoadingAllAutoTags &&
      !isLoadingActiveStates &&
      !isLoadingWebsites &&
      !!programs &&
      !!allAutoTags &&
      !!activeStates &&
      !!websites
    ) {
      setAutoTagEvents(calculateAutoTagEvents(programs as Activity[], allAutoTags as AutoTag[]));
    }
  }, [
    isLoadingPrograms,
    isLoadingAllAutoTags,
    isLoadingActiveStates,
    isLoadingWebsites,
    allAutoTags,
    programs,
    activeStates,
    websites,
  ]);

  const handleKeyUpEvent = async (evt: KeyboardEvent) => {
    // Use state setter function to get latest state, since this event handler happens outside the react
    setSelectedEvent((oldSelectedEvent) => {
      if (evt.key === 'Delete') {
        // Delete selected event
        if (oldSelectedEvent?.id && oldSelectedEvent?.type === TimelineType.Tag) {
          (async () => {
            await deleteTag({
              id: oldSelectedEvent.id as string,
            });
            await refetchTags();
            toast('Tag was deleted', { type: 'success' });
          })();
        } else {
          toast('No tag was selected', { type: 'warning' });
        }
      }
      return null;
    });
  };

  const handleMouseDown = (timelineId: string, posX: number) => {
    setSelectionStartPercent(clamp(posX, 0, 100));
    setSelectionMovePercent(null);
    setSelectionEndPercent(null);
    setActiveSelectionTimeline(timelineId);
  };

  const handleMouseMove = (timelineId: string, posX: number) => {
    if (!selectionStartPercent) {
      // No selection started yet
      return;
    }
    if (selectionStartPercent && selectionEndPercent) {
      // Selection already ended
      return;
    }
    setSelectionMovePercent(posX);
  };

  const handleMouseUp = (timelineId: string, posX: number) => {
    if (posX === selectionStartPercent) {
      setSelectionStartPercent(null);
      setSelectionEndPercent(null);
      setActiveSelectionTimeline(null);
      setSelectedEvent(null);
    } else {
      setSelectionEndPercent(clamp(posX, 0, 100));
    }
  };

  const handleCreateTagName = async (title: string): Promise<TagName> => {
    return createTagName({
      requestBody: {
        title,
        color: COLOR_LIST[(tagNamesCount || 0) % COLOR_LIST.length], // Get a new color that hasn't been recently used
      },
    }) as Promise<TagName>;
  };

  const handleCreateTag = async (tagNameId: string): Promise<void> => {
    await createTag({
      requestBody: {
        tagNameId,
        startedAt: selectionStartTime.toISOString(),
        endedAt: selectionEndTime.toISOString(),
      },
    });
    await Promise.all([refetchTags(), refetchTagNamesCount()]);
  };

  const setSelectedEventAndTimeline = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setSelectedTimeline(event.type);
  };

  if (isLoadingPrograms) {
    return <>Loading program activity...</>;
  }
  if (isLoadingTags) {
    return <>Loading program activity...</>;
  }
  const selection =
    selectionStartPercent && (selectionEndPercent || selectionMovePercent)
      ? {
          start: Math.min(
            selectionStartPercent,
            (selectionEndPercent || selectionMovePercent) as number
          ),
          end: Math.max(
            selectionStartPercent,
            (selectionEndPercent || selectionMovePercent) as number
          ),
        }
      : null;

  return (
    <div className="c-app">
      <div>
        <Timeline
          name="Tags"
          events={tagEvents}
          minTime={minTime}
          maxTime={maxTime}
          onMouseDown={(posX: number) => handleMouseDown(TimelineType.Tag, posX)}
          onMouseMove={(posX: number) => handleMouseMove(TimelineType.Tag, posX)}
          onMouseUp={(posX: number) => handleMouseUp(TimelineType.Tag, posX)}
          selectionPercentages={activeSelectionTimeline === TimelineType.Tag ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEventAndTimeline}
        ></Timeline>
        <Timeline
          name="Auto tags"
          events={autoTagEvents}
          minTime={minTime}
          maxTime={maxTime}
          onMouseDown={(posX: number) => handleMouseDown(TimelineType.AutoTag, posX)}
          onMouseMove={(posX: number) => handleMouseMove(TimelineType.AutoTag, posX)}
          onMouseUp={(posX: number) => handleMouseUp(TimelineType.AutoTag, posX)}
          selectionPercentages={activeSelectionTimeline === TimelineType.AutoTag ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEventAndTimeline}
        ></Timeline>
        <Timeline
          name="Active"
          events={activeStateEvents}
          minTime={minTime}
          maxTime={maxTime}
          onMouseDown={(posX: number) => handleMouseDown(TimelineType.Active, posX)}
          onMouseMove={(posX: number) => handleMouseMove(TimelineType.Active, posX)}
          onMouseUp={(posX: number) => handleMouseUp(TimelineType.Active, posX)}
          selectionPercentages={activeSelectionTimeline === TimelineType.Active ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEventAndTimeline}
        ></Timeline>
        <Timeline
          name="Programs"
          events={programEvents}
          minTime={minTime}
          maxTime={maxTime}
          onMouseDown={(posX: number) => handleMouseDown(TimelineType.Program, posX)}
          onMouseMove={(posX: number) => handleMouseMove(TimelineType.Program, posX)}
          onMouseUp={(posX: number) => handleMouseUp(TimelineType.Program, posX)}
          selectionPercentages={activeSelectionTimeline === TimelineType.Program ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEventAndTimeline}
        ></Timeline>
        <Timeline
          name="Websites"
          events={websiteEvents}
          minTime={minTime}
          maxTime={maxTime}
          onMouseDown={(posX: number) => handleMouseDown(TimelineType.Website, posX)}
          onMouseMove={(posX: number) => handleMouseMove(TimelineType.Website, posX)}
          onMouseUp={(posX: number) => handleMouseUp(TimelineType.Website, posX)}
          selectionPercentages={activeSelectionTimeline === TimelineType.Website ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEventAndTimeline}
        ></Timeline>
        {calendarList.map((calendar) => (
          <Timeline
            key={'calendar-timeline-' + calendar.id}
            name={calendar.title}
            events={getEventsForCalendar(calendar.id)}
            minTime={minTime}
            maxTime={maxTime}
            onMouseDown={(posX: number) => handleMouseDown(TimelineType.Calendar, posX)}
            onMouseMove={(posX: number) => handleMouseMove(TimelineType.Calendar, posX)}
            onMouseUp={(posX: number) => handleMouseUp(TimelineType.Calendar, posX)}
            selectionPercentages={
              activeSelectionTimeline === TimelineType.Calendar ? selection : null
            }
            onCreateTagName={handleCreateTagName}
            onCreateTag={handleCreateTag}
            selectedEvent={selectedEvent}
            setSelectedEvent={setSelectedEventAndTimeline}
          />
        ))}
      </div>
      <EventsTable events={timelineEvents[selectedTimeline]} />
    </div>
  );
}

export default TimelinesPage;
