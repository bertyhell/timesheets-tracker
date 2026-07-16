import './TimelinesAndEventsPage.css';
import { toast } from 'react-toastify';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { endOfDay, format, startOfDay } from 'date-fns';
import { TimelineType } from '../../components/Timeline/Timeline.types';
import { useAtom } from 'jotai';
import { sidebarCollapsedAtom, viewDateAtom } from '../../store/store';
import { EventsTable } from '../../components/EventsTable/EventsTable';
import { EventsTotalsTable } from '../../components/EventsTotalsTable/EventsTotalsTable';
import type {
  TimelineEventDto,
  TimelineWithEventsDto,
  TimelinesControllerFindAllEventsResponse,
} from '../../generated/api/types.gen';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  tagsControllerRemoveMutation,
  timelinesControllerFindAllEventsOptions,
  timelinesControllerFindAllEventsQueryKey,
  timelinesControllerFindAllOptions,
} from '../../generated/api/@tanstack/react-query.gen';
import { timelinesControllerFindAllEvents } from '../../generated/api/sdk.gen';
import GlobalSearchBar from '../../components/GlobalSearchBar/GlobalSearchBar';
import DateSelect from '../../components/DateSelect/DateSelect';
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
  useDefaultLayout,
} from 'react-resizable-panels';
import Button, { ButtonVariant } from '../../components/Button/Button';
import { ROUTE_PARTS } from '../../App';
import { Menu, Plus } from 'lucide-react';
import { TimelinesViewer } from '../../components/TimelinesViewer/TimelinesViewer';

const NO_EVENTS_MESSAGE_BY_TYPE: Record<TimelineType, string> = {
  [TimelineType.Calendar]: 'No calendar events',
  [TimelineType.Program]: 'No active programs',
  [TimelineType.ActiveState]: 'No activity logs',
  [TimelineType.AutoTag]: 'No auto tags',
  [TimelineType.Tag]: 'No tags',
  [TimelineType.Website]: 'No website activity',
  [TimelineType.GitCommit]: 'No git commits',
  [TimelineType.Productive]: 'No planned time',
};

export function TimelinesAndEventsPage() {
  const [viewDate] = useAtom(viewDateAtom);
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const dateParam = format(viewDate, 'yyyy-MM-dd');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const eventsQueryKey = timelinesControllerFindAllEventsQueryKey({
    query: {
      startedAt: startOfDay(viewDate).toISOString(),
      endedAt: endOfDay(viewDate).toISOString(),
    },
  });

  const { mutateAsync: deleteTag } = useMutation({
    ...tagsControllerRemoveMutation(),
    onMutate: async ({ path: { id: tagId } }) => {
      await queryClient.cancelQueries({ queryKey: eventsQueryKey });
      const previous =
        queryClient.getQueryData<TimelinesControllerFindAllEventsResponse>(eventsQueryKey);
      queryClient.setQueryData<TimelinesControllerFindAllEventsResponse>(
        eventsQueryKey,
        (old) =>
          old?.map((timeline) => ({
            ...timeline,
            events: timeline.events?.filter((e) => e.id !== tagId) ?? [],
          })) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(eventsQueryKey, context.previous);
      }
      toast('Failed to delete tag', { type: 'error' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKey });
    },
  });

  const [selectedTimelineAndEvent, setSelectedTimelineAndEvent] = useState<{
    selectedTimelineId: string | null;
    selectedEventId: string | null;
  }>({
    selectedTimelineId: null,
    selectedEventId: null,
  });
  const selectedTimeline: TimelineWithEventsDto | null = useMemo(
    () =>
      timelinesWithEvents?.find(
        (timelinesWithEvent) => timelinesWithEvent.id === selectedTimelineAndEvent.selectedTimelineId
      ) || null,
    [timelinesWithEvents, selectedTimelineAndEvent.selectedTimelineId]
  );
  const selectedEvent: TimelineEventDto | null = useMemo(
    () =>
      selectedTimeline?.events?.find(
        (event) => event.id === selectedTimelineAndEvent.selectedEventId
      ) || null,
    [selectedTimeline, selectedTimelineAndEvent.selectedEventId]
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

  const handleDeleteTag = useCallback(
    (tagId: string) => deleteTag({ path: { id: tagId } }),
    [deleteTag]
  );

  const handleRefreshEvents = useCallback(async () => {
    const query = {
      startedAt: startOfDay(viewDate).toISOString(),
      endedAt: endOfDay(viewDate).toISOString(),
      clearCache: true,
    };
    const result = await timelinesControllerFindAllEvents({ query });
    queryClient.setQueryData<TimelinesControllerFindAllEventsResponse>(eventsQueryKey, result.data);
    // The backend cleared its cached Productive lists; drop the client caches too
    // so the sync modal refetches them fresh.
    await queryClient.invalidateQueries({ queryKey: ['productive'] });
  }, [viewDate, eventsQueryKey, queryClient]);

  const totalEventCount = selectedTimeline?.events?.length ?? 0;

  const noEventsMessage = selectedTimeline?.type
    ? NO_EVENTS_MESSAGE_BY_TYPE[selectedTimeline.type]
    : 'No events';

  const { defaultLayout: verticalDefaultLayout, onLayoutChanged: onVerticalLayoutChanged } =
    useDefaultLayout({ id: 'timelines-vertical', storage: localStorage });

  const { defaultLayout: horizontalDefaultLayout, onLayoutChanged: onHorizontalLayoutChanged } =
    useDefaultLayout({ id: 'timelines-horizontal', storage: localStorage });

  const renderTimelinesAndEvents = () => {
    return (
      <PanelGroup
        orientation="vertical"
        className="p-timelines-page"
        defaultLayout={verticalDefaultLayout}
        onLayoutChanged={onVerticalLayoutChanged}
      >
        <Panel defaultSize="50%" minSize="15%" className="c-timelines-panel">
          <TimelinesViewer
            timelineInfos={timelineInfos}
            timelinesWithEvents={timelinesWithEvents}
            viewDate={viewDate}
            selectedTimelineAndEvent={selectedTimelineAndEvent}
            setSelectedTimelineAndEvent={setSelectedTimelineAndEvent}
            refetchTimelinesWithEvents={refetchTimelinesWithEvents}
            onDeleteTag={handleDeleteTag}
            onRefreshEvents={handleRefreshEvents}
          ></TimelinesViewer>
        </Panel>

        <PanelResizeHandle className="c-resize-handle c-resize-handle--horizontal" />

        <Panel minSize="10%" className="c-timeline-events-list">
          {/* Events section header */}
          <div className="c-events-section-header">
            <div className="c-events-section-header__title">
              <span>Events</span>
              {totalEventCount > 0 && (
                <span className="c-events-count-badge">{totalEventCount}</span>
              )}
            </div>
          </div>

          <PanelGroup
            orientation="horizontal"
            defaultLayout={horizontalDefaultLayout}
            onLayoutChanged={onHorizontalLayoutChanged}
          >
            <Panel minSize="15%" defaultSize="70%">
              {!selectedTimeline?.events?.length ? (
                <div className="c-no-events">{noEventsMessage}</div>
              ) : (
                <EventsTable
                  className="c-events-table"
                  timeline={selectedTimeline}
                  events={selectedTimeline.events}
                  onAddBulkTag={(bulkEvents) =>
                    navigate(
                      {
                        pathname: '/' + ROUTE_PARTS.timelinesAndEvents + '/' + ROUTE_PARTS.bulkTag,
                        search: '?date=' + dateParam,
                      },
                      { state: { events: bulkEvents } }
                    )
                  }
                  onEditTag={(eventId) =>
                    navigate(
                      '/' +
                        ROUTE_PARTS.timelinesAndEvents +
                        '/' +
                        eventId +
                        '/' +
                        ROUTE_PARTS.edit +
                        '?date=' +
                        dateParam
                    )
                  }
                  onDeleteTag={async (eventId) => {
                    await deleteTag({ path: { id: eventId } });
                    toast('Tag was deleted', { type: 'success' });
                  }}
                  onCreateTagFromEvent={(startedAt, endedAt) => {
                    const params = new URLSearchParams({ startedAt, endedAt, date: dateParam });
                    navigate(
                      '/' +
                        ROUTE_PARTS.timelinesAndEvents +
                        '/' +
                        ROUTE_PARTS.create +
                        '?' +
                        params.toString()
                    );
                  }}
                  onCreateAutoTagRuleFromEvent={(conditions) => {
                    const params = new URLSearchParams();
                    if (conditions.length) {
                      params.set('conditions', JSON.stringify(conditions));
                    }
                    navigate(
                      '/' +
                        ROUTE_PARTS.manage +
                        '/' +
                        ROUTE_PARTS.autoTagRules +
                        '/' +
                        ROUTE_PARTS.create +
                        '?' +
                        params.toString()
                    );
                  }}
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
                  onEditTag={(eventId) =>
                    navigate(
                      '/' +
                        ROUTE_PARTS.timelinesAndEvents +
                        '/' +
                        eventId +
                        '/' +
                        ROUTE_PARTS.edit +
                        '?date=' +
                        dateParam
                    )
                  }
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
      {/* Page header */}
      <div className="p-page-header-area">
        <div className="p-page-header-left">
          <button
            className="c-sidebar-toggle"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="p-page-title">Timeline &amp; Events</h1>
            <p className="p-page-subtitle">Track your time across all timelines</p>
          </div>
        </div>

        <div className="p-page-header-right">
          {isLoadingTimelineEvents && <span className="p-loading-indicator">Loading...</span>}
          {isLoadingTimelineEvents && <div className="p-header-divider" />}
          <DateSelect />
          <div className="p-header-divider" />
          <GlobalSearchBar />
          <div className="p-header-divider" />
          <Button
            variant={ButtonVariant.Primary}
            icon={<Plus size={14} />}
            onClick={() =>
              navigate(
                '/' + ROUTE_PARTS.timelinesAndEvents + '/' + ROUTE_PARTS.create + '?date=' + dateParam
              )
            }
            title="Create tag"
          >
            <span className="hidden wide:inline">Create tag</span>
          </Button>
        </div>
      </div>

      {renderPageContent()}
      <Outlet />
    </div>
  );
}
