import './TimelinesAndEventsPage.css';
import { toast } from 'react-toastify';
import React, { ReactNode, useEffect, useState } from 'react';
import Timeline from '../../components/Timeline/Timeline';
import {
  addHours,
  addMilliseconds,
  differenceInMilliseconds,
  endOfDay,
  parseISO,
  startOfDay,
  subHours,
} from 'date-fns';
import { TimelineType } from '../../components/Timeline/Timeline.types';
import type { TagName } from '../../types/types';
import { clamp, maxBy, minBy } from 'lodash-es';
import { useAtom } from 'jotai';
import { viewDateAtom, sidebarCollapsedAtom } from '../../store/store';
import { EventsTable } from '../../components/EventsTable/EventsTable';
import { EventsTotalsTable } from '../../components/EventsTotalsTable/EventsTotalsTable';
import { TimelineRuler } from '../../components/Timeline/TimelineRuler';
import type { TimelineEventDto, TimelineWithEventsDto } from '../../generated/api/types.gen';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  tagNamesControllerCountOptions,
  tagNamesControllerCreateMutation,
  tagsControllerCreateMutation,
  tagsControllerRemoveMutation,
  timelinesControllerFindAllEventsOptions,
  timelinesControllerFindAllOptions,
} from '../../generated/api/@tanstack/react-query.gen';
import { COLOR_LIST } from '../../components/Timeline/helpers/getColorForEvent';
import GlobalSearchBar from '../../components/GlobalSearchBar/GlobalSearchBar';
import DateSelect from '../../components/DateSelect/DateSelect';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { isApproxEqual } from '../../helpers/is-approx-equal';

export function TimelinesAndEventsPage() {
  const [viewDate] = useAtom(viewDateAtom);
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);

  const { data: timelineInfos, isLoading: isLoadingTimelineInfos } = useQuery({
    ...timelinesControllerFindAllOptions(),
  });

  const {
    data: timelinesWithEvents,
    isLoading: isLoadingTimelineEvents,
    refetch: refetchTimelinesWithEvents,
  } = useQuery({
    ...timelinesControllerFindAllEventsOptions({
      query: {
        startedAt: startOfDay(viewDate).toISOString(),
        endedAt: endOfDay(viewDate).toISOString(),
      },
    }),
    enabled: !!timelineInfos,
  });

  const { data: tagNamesCount, refetch: refetchTagNamesCount } = useQuery({
    ...tagNamesControllerCountOptions(),
  });
  const { mutateAsync: deleteTag } = useMutation({ ...tagsControllerRemoveMutation() });

  const { mutateAsync: createTagName } = useMutation({ ...tagNamesControllerCreateMutation() });
  const { mutateAsync: createTag } = useMutation({ ...tagsControllerCreateMutation() });

  const [selectionStartPercent, setSelectionStartPercent] = useState<number | null>(null);
  const [selectionMovePercent, setSelectionMovePercent] = useState<number | null>(null);
  const [selectionEndPercent, setSelectionEndPercent] = useState<number | null>(null);
  const [activeSelectionTimeline, setActiveSelectionTimeline] = useState<string | null>(null);
  const [selectedTimelineAndEvent, setSelectedTimelineAndEvent] = useState<{
    selectedTimelineId: string | null;
    selectedEventId: string | null;
  }>({
    selectedTimelineId: null,
    selectedEventId: null,
  });
  const selectedTimeline: TimelineWithEventsDto | null =
    timelinesWithEvents?.find(
      (timelinesWithEvent) => timelinesWithEvent.id === selectedTimelineAndEvent.selectedTimelineId
    ) || null;
  console.log('selected timeline: ', selectedTimeline);
  const selectedEvent: TimelineEventDto | null =
    selectedTimeline?.events?.find(
      (event) => event.id === selectedTimelineAndEvent.selectedEventId
    ) || null;

  const allEvents = timelinesWithEvents?.flatMap((timelineWithEvents) => timelineWithEvents.events);
  const firstEvent = minBy(allEvents || [], (event: TimelineEventDto) =>
    new Date(event.startedAt).getTime()
  );
  const lastEvent = maxBy(allEvents || [], (event: TimelineEventDto) =>
    new Date(event.endedAt).getTime()
  );
  const minTime: Date = firstEvent
    ? subHours(parseISO(firstEvent.startedAt), 1)
    : startOfDay(new Date());
  const maxTime: Date = lastEvent ? addHours(parseISO(lastEvent.endedAt), 1) : endOfDay(viewDate);

  const windowInMilliseconds = differenceInMilliseconds(maxTime, minTime);
  const selectionStartTime = addMilliseconds(
    minTime,
    (windowInMilliseconds / 100) * (selectionStartPercent || 0)
  );
  const selectionEndTime = addMilliseconds(
    minTime,
    (windowInMilliseconds / 100) * (selectionEndPercent || 0)
  );

  useEffect(() => {
    if (!timelineInfos?.length || selectedTimelineAndEvent.selectedTimelineId !== null) {
      return;
    }
    const programsTimeline = timelineInfos.find((t) => t.timelineType === TimelineType.Program);
    const defaultTimeline = programsTimeline ?? timelineInfos[0];
    setSelectedTimelineAndEvent({ selectedTimelineId: defaultTimeline.id, selectedEventId: null });
  }, [timelineInfos]);

  useEffect(() => {
    document.addEventListener('keyup', handleKeyUpEvent);

    return () => {
      document.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, []);

  const handleKeyUpEvent = async (evt: KeyboardEvent) => {
    if (!(evt.target as Element)?.closest('.c-timelines')) {
      return;
    }
    // Use state setter function to get latest state, since this event handler happens outside the react
    setSelectedTimelineAndEvent(() => {
      if (evt.key === 'Delete') {
        // Delete selected event
        if (selectedEvent?.id && selectedTimeline?.type === TimelineType.Tag) {
          (async () => {
            await deleteTag({
              path: { id: selectedEvent?.id as string },
            });
            await refetchTimelinesWithEvents();
            toast('Tag was deleted', { type: 'success' });
          })();
        } else {
          toast('No tag was selected', { type: 'warning' });
        }
      }
      return {
        selectedTimelineId: selectedTimeline?.id || null,
        selectedEventId: null,
      };
    });
  };

  const handleMouseDown = (timelineId: string, posX: number) => {
    console.log('mouse down: ', posX);
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

  const handleMouseUp = (timelineId: string, posX: number, eventId: string | null) => {
    console.log('mouse up: ', posX);
    if (isApproxEqual(posX, selectionStartPercent)) {
      console.log('approx equal');
      setSelectionStartPercent(null);
      setSelectionEndPercent(null);
      setActiveSelectionTimeline(null);
      setSelectedTimelineAndEvent({
        selectedTimelineId: timelineId,
        selectedEventId: eventId,
      });
    } else {
      console.log('set selection percent');
      setSelectionEndPercent(clamp(posX, 0, 100));
    }
  };

  const handleCreateTagName = async (title: string): Promise<TagName> => {
    return (await createTagName({
      body: {
        title,
        color: COLOR_LIST[(tagNamesCount || 0) % COLOR_LIST.length], // Get a new color that hasn't been recently used
      },
    })) as unknown as TagName;
  };

  const handleCreateTag = async (tagNameId: string): Promise<void> => {
    await createTag({
      body: {
        tagNameId,
        startedAt: selectionStartTime.toISOString(),
        endedAt: selectionEndTime.toISOString(),
      },
    });
    await Promise.all([refetchTimelinesWithEvents(), refetchTagNamesCount()]);
  };

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

  const renderTimelines = (): ReactNode | ReactNode[] => {
    if (timelineInfos?.length === 0) {
      return <div className="u-center">No timelines</div>;
    }
    return (timelineInfos || []).map((timelineInfo) => {
      return (
        <Timeline
          timelineInfo={timelineInfo}
          events={
            timelinesWithEvents?.find((timelineWithEvents) => {
              return timelineWithEvents.id === timelineInfo.id;
            })?.events || ([] as TimelineEventDto[])
          }
          minTime={minTime}
          maxTime={maxTime}
          onMouseDown={(posX: number) => handleMouseDown(timelineInfo.id, posX)}
          onMouseMove={(posX: number) => handleMouseMove(timelineInfo.id, posX)}
          onMouseUp={(posX: number, eventId: string | null) =>
            handleMouseUp(timelineInfo.id, posX, eventId)
          }
          selectionPercentages={activeSelectionTimeline === timelineInfo.id ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={(event, timeline) =>
            setSelectedTimelineAndEvent({
              selectedTimelineId: timeline.id,
              selectedEventId: event.id,
            })
          }
          isActive={selectedTimeline?.id === timelineInfo.id}
        ></Timeline>
      );
    });
  };

  const renderTimelinesAndEvents = () => {
    return (
      <PanelGroup orientation="vertical" className="p-timelines-page">
        <Panel defaultSize="50%" minSize="15%" className="c-timelines-panel">
          <div className="c-timelines">
            <TimelineRuler minTime={minTime} maxTime={maxTime} />
            {renderTimelines()}
          </div>
        </Panel>

        <PanelResizeHandle className="c-resize-handle c-resize-handle--horizontal" />

        <Panel minSize="10%" className="c-timeline-events-list">
          <PanelGroup orientation="horizontal">
            <Panel minSize="15%" defaultSize="70%">
              {!selectedTimeline?.events?.length ? (
                <div className="u-center">No events</div>
              ) : (
                <EventsTable
                  className="c-events-table"
                  timeline={selectedTimeline}
                  events={selectedTimeline.events}
                />
              )}
            </Panel>

            <PanelResizeHandle className="c-resize-handle c-resize-handle--vertical" />

            <Panel minSize="15%" defaultSize="30%">
              {!selectedTimeline?.events?.length ? null : (
                <EventsTotalsTable
                  className="c-events-totals-table"
                  events={selectedTimeline.events}
                  timelineType={selectedTimeline.type}
                />
              )}
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    );
  };

  const renderPageContent = () => {
    if (isLoadingTimelineInfos && !timelineInfos) {
      return <>Loading timelines...</>;
    }

    return renderTimelinesAndEvents();
  };

  return (
    <div className="p-timelines-and-events-page">
      <div className="m-page-toolbar">
        <button
          className="c-sidebar-toggle"
          onClick={() => setSidebarCollapsed((prev) => !prev)}
          aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <GlobalSearchBar />
        <DateSelect />
        {isLoadingTimelineEvents && <div>Loading...</div>}
      </div>
      {renderPageContent()}
    </div>
  );
}
