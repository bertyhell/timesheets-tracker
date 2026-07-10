import React, { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import {
  TimelineDto,
  TimelineEventDto,
  TimelinesControllerFindAllEventsResponse,
  TimelineWithEventsDto,
} from '../../generated/api';
import Timeline from '../Timeline/Timeline';
import { clamp, maxBy, minBy } from 'lodash-es';
import {
  addHours,
  addMilliseconds,
  differenceInMilliseconds,
  endOfDay,
  parseISO,
  startOfDay,
  subHours,
} from 'date-fns';
import { TimelineRuler } from '../Timeline/TimelineRuler';
import { isApproxEqual } from '../../helpers/is-approx-equal';
import { ROUTE_PARTS } from '../../App';
import { useNavigate } from 'react-router-dom';
import { TagName } from '../../types/types';
import {
  QueryObserverResult,
  RefetchOptions,
  Register,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  tagNamesControllerCountOptions,
  tagNamesControllerCreateMutation,
  tagsControllerCreateMutation,
  tagsControllerUpdateMutation,
  timelinesControllerFindAllEventsQueryKey,
} from '../../generated/api/@tanstack/react-query.gen';
import { toast } from 'react-toastify';
import { RuleTester } from 'oxlint/plugins-dev';
import Error = RuleTester.Error;

interface TimelinesViewerProps {
  timelineInfos: TimelineDto[] | undefined;
  timelinesWithEvents?: Array<TimelineWithEventsDto> | undefined;
  viewDate: Date;
  selectedTimelineAndEvent?: { selectedTimelineId: string | null; selectedEventId: string | null };
  setSelectedTimelineAndEvent: (newState: {
    selectedTimelineId: string | null;
    selectedEventId: string | null;
  }) => void;
  refetchTimelinesWithEvents: (options?: RefetchOptions) => Promise<
    QueryObserverResult<
      Array<TimelineWithEventsDto>,
      Register extends {
        defaultError: infer TError;
      }
        ? TError
        : Error
    >
  >;
  onDeleteTag: (tagId: string) => Promise<unknown>;
}

export const TimelinesViewer: FC<TimelinesViewerProps> = ({
  timelineInfos,
  timelinesWithEvents,
  viewDate,
  selectedTimelineAndEvent,
  setSelectedTimelineAndEvent,
  refetchTimelinesWithEvents,
  onDeleteTag,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const ZOOM_FACTOR = 0.7;
  const MIN_SPAN = 0.0007; // ~60 seconds minimum visible window

  const [activeSelectionTimeline, setActiveSelectionTimeline] = useState<string | null>(null);
  const allEvents = timelinesWithEvents?.flatMap((timelineWithEvents) => timelineWithEvents.events);
  const selectedTimeline: TimelineWithEventsDto | null =
    timelinesWithEvents?.find(
      (timelinesWithEvent) => timelinesWithEvent.id === selectedTimelineAndEvent?.selectedTimelineId
    ) || null;
  const selectedEvent: TimelineEventDto | null =
    selectedTimeline?.events?.find(
      (event) => event.id === selectedTimelineAndEvent?.selectedEventId
    ) || null;
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

  const [selectionStartPercent, setSelectionStartPercent] = useState<number | null>(null);
  const [selectionMovePercent, setSelectionMovePercent] = useState<number | null>(null);
  const [selectionEndPercent, setSelectionEndPercent] = useState<number | null>(null);

  // Full day is the zoom boundary — viewStart/viewEnd are fractions of the full day
  const dayStart = startOfDay(viewDate);
  const dayEnd = endOfDay(viewDate);
  const dayWindowMs = differenceInMilliseconds(dayEnd, dayStart);

  // Zoom/pan state: fractions [0,1] of the full minTime–maxTime window
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(1);

  // Visible (zoomed) time window
  const visibleMinTime = addMilliseconds(dayStart, viewStart * dayWindowMs);
  const visibleMaxTime = addMilliseconds(dayStart, viewEnd * dayWindowMs);
  const visibleWindowMs = differenceInMilliseconds(visibleMaxTime, visibleMinTime);

  const selectionStartTime = addMilliseconds(
    visibleMinTime,
    (visibleWindowMs / 100) * (selectionStartPercent || 0)
  );
  const selectionEndTime = addMilliseconds(
    visibleMinTime,
    (visibleWindowMs / 100) * (selectionEndPercent || 0)
  );

  const [isDragging, setIsDragging] = useState(false);
  const viewStartRef = useRef(0);
  const viewEndRef = useRef(1);
  const timelinesContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    trackWidth: number;
    startViewStart: number;
    startViewEnd: number;
  } | null>(null);

  // Track whether we've already auto-zoomed to the event range for the current date
  const initialZoomSetForDate = useRef<string | null>(null);

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

  const { mutateAsync: updateTag } = useMutation({ ...tagsControllerUpdateMutation() });

  const { mutateAsync: createTagName } = useMutation({ ...tagNamesControllerCreateMutation() });
  const { mutateAsync: createTag } = useMutation({ ...tagsControllerCreateMutation() });

  const { data: tagNamesCount, refetch: refetchTagNamesCount } = useQuery({
    ...tagNamesControllerCountOptions(),
  });

  // Reset zoom to full day when the date changes
  useEffect(() => {
    initialZoomSetForDate.current = null;
    setZoom(0, 1);
  }, [viewDate]);

  // Auto-zoom to the event range the first time events load for a date
  useEffect(() => {
    const hasEvents = timelinesWithEvents?.some((t) => t.events && t.events.length > 0);
    if (!hasEvents) return;
    const dateKey = viewDate.toISOString().slice(0, 10);
    if (initialZoomSetForDate.current === dateKey) return;
    initialZoomSetForDate.current = dateKey;
    const newStart = Math.max(0, differenceInMilliseconds(minTime, dayStart) / dayWindowMs);
    const newEnd = Math.min(1, differenceInMilliseconds(maxTime, dayStart) / dayWindowMs);
    if (newStart < newEnd) setZoom(newStart, newEnd);
  }, [timelinesWithEvents]);

  const handleWheel = (e: WheelEvent) => {
    if (!timelinesContainerRef.current) {
      return;
    }
    e.preventDefault();
    const rect = timelinesContainerRef.current.getBoundingClientRect();
    const gutterEl = timelinesContainerRef.current.querySelector(
      '.c-timeline-ruler__gutter'
    ) as HTMLElement | null;
    const gutterWidth = gutterEl ? gutterEl.offsetWidth : 112;
    const trackWidth = rect.width - gutterWidth;
    if (trackWidth <= 0) return;

    const mouseXInTrack = e.clientX - rect.left - gutterWidth;
    const fraction = Math.max(0, Math.min(1, mouseXInTrack / trackWidth));

    const curStart = viewStartRef.current;
    const curEnd = viewEndRef.current;
    const focal = curStart + fraction * (curEnd - curStart);

    const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
    const currentSpan = curEnd - curStart;
    let newSpan = Math.max(MIN_SPAN, Math.min(1, currentSpan * factor));

    let newStart = focal - fraction * newSpan;
    let newEnd = focal + (1 - fraction) * newSpan;

    if (newStart < 0) {
      newEnd = Math.min(1, newEnd - newStart);
      newStart = 0;
    }
    if (newEnd > 1) {
      newStart = Math.max(0, newStart - (newEnd - 1));
      newEnd = 1;
    }

    setZoom(newStart, newEnd);
  };

  // Non-passive wheel listener for zoom
  useEffect(() => {
    const el = timelinesContainerRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const setZoom = (start: number, end: number) => {
    viewStartRef.current = start;
    viewEndRef.current = end;
    setViewStart(start);
    setViewEnd(end);
  };

  // Global mouse handlers for middle-mouse drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { startX, trackWidth, startViewStart, startViewEnd } = dragRef.current;
      const span = startViewEnd - startViewStart;
      const deltaFraction = -((e.clientX - startX) / trackWidth) * span;
      let newStart = startViewStart + deltaFraction;
      let newEnd = startViewEnd + deltaFraction;
      if (newStart < 0) {
        newEnd = span;
        newStart = 0;
      }
      if (newEnd > 1) {
        newStart = 1 - span;
        newEnd = 1;
      }
      setZoom(newStart, newEnd);
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        dragRef.current = null;
        setIsDragging(false);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleTimelinesMiddleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 1) return;
    e.preventDefault();
    const el = timelinesContainerRef.current;
    if (!el) return;
    const gutterEl = el.querySelector('.c-timeline-ruler__gutter') as HTMLElement | null;
    const gutterWidth = gutterEl ? gutterEl.offsetWidth : 112;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      trackWidth: rect.width - gutterWidth,
      startViewStart: viewStartRef.current,
      startViewEnd: viewEndRef.current,
    };
    setIsDragging(true);
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
    } else if (selectionStartPercent !== null) {
      console.log('set selection percent');
      setSelectionEndPercent(clamp(posX, 0, 100));
    }
  };

  const handleZoomIn = () => {
    const focal = (viewStartRef.current + viewEndRef.current) / 2;
    const newSpan = Math.max(MIN_SPAN, (viewEndRef.current - viewStartRef.current) * ZOOM_FACTOR);
    let newStart = focal - newSpan / 2;
    let newEnd = focal + newSpan / 2;
    if (newStart < 0) {
      newEnd = Math.min(1, newEnd - newStart);
      newStart = 0;
    }
    if (newEnd > 1) {
      newStart = Math.max(0, newStart - (newEnd - 1));
      newEnd = 1;
    }
    setZoom(newStart, newEnd);
  };

  const handleZoomOut = () => {
    const focal = (viewStartRef.current + viewEndRef.current) / 2;
    const newSpan = Math.min(1, (viewEndRef.current - viewStartRef.current) / ZOOM_FACTOR);
    let newStart = focal - newSpan / 2;
    let newEnd = focal + newSpan / 2;
    if (newStart < 0) {
      newEnd = Math.min(1, newEnd - newStart);
      newStart = 0;
    }
    if (newEnd > 1) {
      newStart = Math.max(0, newStart - (newEnd - 1));
      newEnd = 1;
    }
    setZoom(newStart, newEnd);
  };

  const handlePanLeft = () => {
    const span = viewEndRef.current - viewStartRef.current;
    const newStart = Math.max(0, viewStartRef.current - span * 0.2);
    setZoom(newStart, newStart + span);
  };

  const handlePanRight = () => {
    const span = viewEndRef.current - viewStartRef.current;
    const newEnd = Math.min(1, viewEndRef.current + span * 0.2);
    setZoom(newEnd - span, newEnd);
  };

  const handleCreateTagName = async (data: { title: string; code: string; color: string }): Promise<TagName> => {
    return (await createTagName({
      body: {
        title: data.title,
        code: data.code || undefined,
        color: data.color,
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
    // Close the tooltip by clearing the selection
    setSelectionStartPercent(null);
    setSelectionEndPercent(null);
    setSelectionMovePercent(null);
    setActiveSelectionTimeline(null);
  };

  const handleTagResized = async (
    tagId: string,
    newStartedAt: string,
    newEndedAt: string
  ): Promise<void> => {
    const queryKey = timelinesControllerFindAllEventsQueryKey({
      query: {
        startedAt: startOfDay(viewDate).toISOString(),
        endedAt: endOfDay(viewDate).toISOString(),
      },
    });

    // Cancel any in-flight refetches so they don't overwrite the optimistic update
    await queryClient.cancelQueries({ queryKey });

    // Snapshot the current data for rollback on error
    const previousData =
      queryClient.getQueryData<TimelinesControllerFindAllEventsResponse>(queryKey);

    // Immediately update the cache so the bar stays where the user dropped it
    queryClient.setQueryData<TimelinesControllerFindAllEventsResponse>(queryKey, (old) => {
      if (!old) return old;
      return old.map((timeline) => ({
        ...timeline,
        events: timeline.events.map((event) =>
          event.id === tagId ? { ...event, startedAt: newStartedAt, endedAt: newEndedAt } : event
        ),
      }));
    });

    try {
      await updateTag({
        path: { id: tagId },
        body: { startedAt: newStartedAt, endedAt: newEndedAt },
      });
      await refetchTimelinesWithEvents();
    } catch {
      // Roll back the optimistic update if the save failed
      queryClient.setQueryData(queryKey, previousData);
    }
  };

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
          minTime={visibleMinTime}
          maxTime={visibleMaxTime}
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
          onSelectTimeline={() =>
            setSelectedTimelineAndEvent({
              selectedTimelineId: timelineInfo.id,
              selectedEventId: null,
            })
          }
          onTagResized={handleTagResized}
          onDeleteTag={async (tagId: string) => {
            await onDeleteTag(tagId);
            toast('Tag was deleted', { type: 'success' });
          }}
          onEditTag={(tagId: string) => {
            navigate('/' + ROUTE_PARTS.timelinesAndEvents + '/' + tagId + '/' + ROUTE_PARTS.edit);
          }}
          onEditAutoTagRule={(autoTagId: string) => {
            navigate(
              '/' +
                ROUTE_PARTS.manage +
                '/' +
                ROUTE_PARTS.autoTagRules +
                '/' +
                autoTagId +
                '/' +
                ROUTE_PARTS.edit
            );
          }}
          onCreateTagFromEvent={(startedAt: string, endedAt: string) => {
            const params = new URLSearchParams({ startedAt, endedAt });
            navigate(
              '/' +
                ROUTE_PARTS.timelinesAndEvents +
                '/' +
                ROUTE_PARTS.create +
                '?' +
                params.toString()
            );
          }}
        ></Timeline>
      );
    });
  };

  return (
    <div
      className="c-timelines"
      ref={timelinesContainerRef}
      onMouseDown={handleTimelinesMiddleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : undefined }}
    >
      <TimelineRuler
        minTime={visibleMinTime}
        maxTime={visibleMaxTime}
        gutterContent={
          <div className="c-timeline-controls">
            <button
              className="c-timeline-controls__btn"
              onClick={handleZoomIn}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={12} />
            </button>
            <button
              className="c-timeline-controls__btn"
              onClick={handleZoomOut}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={12} />
            </button>
            <button
              className="c-timeline-controls__btn"
              onClick={handlePanLeft}
              title="Pan left"
              aria-label="Pan left"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              className="c-timeline-controls__btn"
              onClick={handlePanRight}
              title="Pan right"
              aria-label="Pan right"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        }
      />
      {renderTimelines()}
    </div>
  );
};
