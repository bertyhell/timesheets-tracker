import './TimelinesPage.scss';
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
import { COLOR_LIST } from './TimelinesPage.consts';
import { clamp, maxBy, minBy } from 'lodash-es';
import { useAtom } from 'jotai';
import { viewDateAtom } from '../../store/store';
import { stringToColorIndex } from '../../helpers/string-to-color-index';
import EventsTable from '../../components/EventsTable/EventsTable';
import {
  TimelineDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../generated/api/requests/types.gen';
import {
  useTagNamesServiceTagNamesControllerCount,
  useTagNamesServiceTagNamesControllerCreate,
  useTagsServiceTagsControllerCreate,
  useTagsServiceTagsControllerRemove,
  useTimelinesServiceTimelinesControllerFindAll,
  useTimelinesServiceTimelinesControllerFindAllEvents,
  useTimelinesServiceTimelinesControllerFindAllEventsKey,
} from '../../generated/api/queries';
import { TimelineEvent } from '../../../../types/types';

function TimelinesPage() {
  const [viewDate] = useAtom(viewDateAtom);

  const { data: timelineInfos, isLoading: isLoadingTimelineInfos } =
    useTimelinesServiceTimelinesControllerFindAll();

  const {
    data: timelinesWithEvents,
    isLoading: isLoadingTimelineEvents,
    refetch: refetchTimelinesWithEvents,
  } = useTimelinesServiceTimelinesControllerFindAllEvents(
    {
      startedAt: startOfDay(viewDate).toISOString(),
      endedAt: endOfDay(viewDate).toISOString(),
    },
    [
      useTimelinesServiceTimelinesControllerFindAllEventsKey,
      startOfDay(viewDate).toISOString(),
      endOfDay(viewDate).toISOString(),
    ],
    {
      enabled: !!timelineInfos,
    }
  );

  const { data: tagNamesCount, refetch: refetchTagNamesCount } =
    useTagNamesServiceTagNamesControllerCount();
  const { mutateAsync: deleteTag } = useTagsServiceTagsControllerRemove();

  const { mutateAsync: createTagName } = useTagNamesServiceTagNamesControllerCreate();
  const { mutateAsync: createTag } = useTagsServiceTagsControllerCreate();

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
    document.addEventListener('keyup', handleKeyUpEvent);

    return () => {
      document.removeEventListener('keyup', handleKeyUpEvent);
    };
  }, []);

  // useEffect(() => {
  //   if (
  //     !isLoadingPrograms &&
  //     !isLoadingAllAutoTags &&
  //     !isLoadingActiveStates &&
  //     !isLoadingWebsites &&
  //     !!programs &&
  //     !!allAutoTags &&
  //     !!activeStates &&
  //     !!websites
  //   ) {
  //     setAutoTagEvents(calculateAutoTagEvents(programs as Program[], allAutoTags as AutoTagDto[]));
  //   }
  // }, [
  //   isLoadingPrograms,
  //   isLoadingAllAutoTags,
  //   isLoadingActiveStates,
  //   isLoadingWebsites,
  //   allAutoTags,
  //   programs,
  //   activeStates,
  //   websites,
  // ]);

  const handleKeyUpEvent = async (evt: KeyboardEvent) => {
    // Use state setter function to get latest state, since this event handler happens outside the react
    setSelectedTimelineAndEvent(() => {
      if (evt.key === 'Delete') {
        // Delete selected event
        if (selectedEvent?.id && selectedTimeline?.type === TimelineType.Tag) {
          (async () => {
            await deleteTag({
              id: selectedEvent?.id as string,
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
      setSelectedTimelineAndEvent({
        selectedTimelineId: timelineId,
        selectedEventId: null,
      });
    } else {
      setSelectionEndPercent(clamp(posX, 0, 100));
    }
  };

  const handleCreateTagName = async (title: string): Promise<TagName> => {
    return (await createTagName({
      requestBody: {
        title,
        color: COLOR_LIST[(tagNamesCount || 0) % COLOR_LIST.length], // Get a new color that hasn't been recently used
      },
    })) as Promise<TagName>;
  };

  const handleCreateTag = async (tagNameId: string): Promise<void> => {
    await createTag({
      requestBody: {
        tagNameId,
        startedAt: selectionStartTime.toISOString(),
        endedAt: selectionEndTime.toISOString(),
      },
    });
    await Promise.all([refetchTimelinesWithEvents(), refetchTagNamesCount()]);
  };

  if (isLoadingTimelineEvents) {
    return <>Loading timelines and events...</>;
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
          onMouseDown={(posX: number) => handleMouseDown(TimelineType.Tag, posX)}
          onMouseMove={(posX: number) => handleMouseMove(TimelineType.Tag, posX)}
          onMouseUp={(posX: number) => handleMouseUp(TimelineType.Tag, posX)}
          selectionPercentages={activeSelectionTimeline === TimelineType.Tag ? selection : null}
          onCreateTagName={handleCreateTagName}
          onCreateTag={handleCreateTag}
          selectedEvent={selectedEvent}
          setSelectedEvent={(event, timeline) =>
            setSelectedTimelineAndEvent({
              selectedTimelineId: timeline.id,
              selectedEventId: event.id,
            })
          }
        ></Timeline>
      );
    });
  };

  const renderSelectedTimelineEvents = () => {
    if (!selectedTimeline?.events?.length) {
      return <div className="u-center">No events</div>;
    }
    return <EventsTable events={selectedTimeline?.events || []} />;
  };

  const renderTimelinesAndEvents = () => {
    return (
      <div className="p-timelines-page">
        <div className="c-timelines">{renderTimelines()}</div>
        <div className="c-timeline-events-list">{renderSelectedTimelineEvents()}</div>
      </div>
    );
  };

  const renderPageContent = () => {
    if (isLoadingTimelineInfos) {
      return <>Loading timelines...</>;
    }
    if (isLoadingTimelineEvents) {
      return <>Loading timeline events...</>;
    }

    return renderTimelinesAndEvents();
  };

  return renderPageContent();
}

export default TimelinesPage;
