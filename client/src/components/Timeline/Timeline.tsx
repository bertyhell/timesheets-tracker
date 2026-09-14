import './Timeline.css';
import React, { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import Button, { ButtonVariant } from '../Button/Button';

import { useNavigate } from 'react-router-dom';
import { ROUTE_PARTS } from '../../App';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import Tooltip from '../Tooltip/Tooltip';
import {
  addMilliseconds,
  differenceInMilliseconds,
  differenceInSeconds,
  format,
  isAfter,
  isBefore,
  parseISO,
  roundToNearestMinutes,
} from 'date-fns';
import { formatDuration } from '../../helpers/format-duration';
import type { TagName } from '../../types/types';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import type {
  AutoTagEventInfoDto,
  TimelineDto,
  TimelineEventDto,
} from '../../generated/api/types.gen';
import { getColorFromString, getRandomColor } from './helpers/getColorForEvent';
import { getTicks } from './helpers/getTicks';
import type { PreparedEvent } from './helpers/prepareEvents';
import { cullAndMergeEvents, summarizeMergedEvents } from './helpers/cullAndMergeEvents';
import { formatMatchedCondition } from './helpers/formatMatchedCondition';
import {
  getMostProminentConditions,
  type ProminentCondition,
} from './helpers/getMostProminentConditions';
import { TimelineType } from './Timeline.types';
import { ColorInput } from '../ColorInput/ColorInput';
import { SyncToProductiveModal } from '../SyncToProductiveModal/SyncToProductiveModal';
import { ExportToCsvModal } from '../ExportToCsvModal/ExportToCsvModal';
import {
  CSV_OUTPUT_ID,
  PRODUCTIVE_OUTPUT_ID,
  readLastSyncOutput,
  useSyncOutputs,
  writeLastSyncOutput,
} from '../SyncOutputMenu/useSyncOutputs';

interface ResizeState {
  tagId: string;
  side: 'start' | 'end';
  originalStartedAt: string;
  originalEndedAt: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  eventId: string;
  event: TimelineEventDto;
  eventStartedAt?: string;
  eventEndedAt?: string;
}

interface TimelineProps {
  timelineInfo: TimelineDto;
  events: PreparedEvent[];
  minTime: Date;
  maxTime: Date;
  onMouseDown: (timelineId: string, posX: number) => void;
  onMouseMove: (timelineId: string, posX: number, hoverPosX: number | null) => void;
  onMouseUp: (timelineId: string, posX: number, eventId: string | null) => void;
  onMouseLeave?: () => void;
  selectionPercentages: { start: number; end: number } | null;
  /**
   * Snap targets as absolute timestamps rather than percentages, so panning and zooming do not
   * rebuild a list that is as long as the event count.
   */
  snapPointTimesMs: number[];
  hoverPercent: number | null;
  onCreateTagName: (data: { title: string; code: string; color: string }) => Promise<TagName>;
  onCreateTag: (tagName: TagName) => Promise<void>;
  selectedEventIds: string[];
  setSelectedEventIds: (eventIds: string[], timeline: TimelineDto) => void;
  isActive: boolean;
  onSelectTimeline: (timelineId: string) => void;
  onTagResized?: (tagId: string, newStartedAt: string, newEndedAt: string) => void;
  onDeleteTag?: (tagId: string) => void;
  onEditTag?: (tagId: string) => void;
  onEditAutoTagRule?: (autoTagId: string) => void;
  onCreateTagFromEvent?: (startedAt: string, endedAt: string) => void;
  onCreateTagFromAutoTagEvent?: (event: TimelineEventDto) => void;
  onCreateAutoTagRuleFromEvent?: (conditions: ProminentCondition[]) => void;
  onGrowAutoTags?: () => void;
  onRefreshEvents?: () => void;
}

interface SnapContext {
  snapTimesMs: number[];
  windowStartMs: number;
  windowMs: number;
  trackWidthPx: number;
}

/**
 * Nearest snap target to `posX` (a percentage of the track), as a percentage again, or null when
 * nothing is within 10 pixels. Snap targets live in time space, so the comparison happens there
 * and only the result is converted back.
 */
function findSnap(posX: number, snap: SnapContext): number | null {
  const { snapTimesMs, windowStartMs, windowMs, trackWidthPx } = snap;
  if (trackWidthPx === 0 || snapTimesMs.length === 0 || windowMs <= 0) return null;
  const thresholdMs = (10 / trackWidthPx) * windowMs;
  const posMs = windowStartMs + (posX / 100) * windowMs;
  let closestDist = Infinity;
  let closestSnapMs = posMs;
  for (const snapMs of snapTimesMs) {
    const dist = Math.abs(posMs - snapMs);
    if (dist < closestDist) {
      closestDist = dist;
      closestSnapMs = snapMs;
    }
  }
  if (closestDist > thresholdMs) return null;
  return ((closestSnapMs - windowStartMs) / windowMs) * 100;
}

function applySnap(posX: number, snap: SnapContext): number {
  return findSnap(posX, snap) ?? posX;
}

function Timeline({
  timelineInfo,
  events,
  minTime,
  maxTime,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave: onMouseLeaveProp,
  selectionPercentages,
  snapPointTimesMs,
  hoverPercent,
  onCreateTagName,
  onCreateTag,
  selectedEventIds,
  setSelectedEventIds,
  isActive,
  onSelectTimeline,
  onTagResized,
  onDeleteTag,
  onEditTag,
  onEditAutoTagRule,
  onCreateTagFromEvent,
  onCreateTagFromAutoTagEvent,
  onCreateAutoTagRuleFromEvent,
  onGrowAutoTags,
  onRefreshEvents,
}: TimelineProps) {
  const navigate = useNavigate();
  const [searchTerm] = useAtom(searchTermAtom);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [resizeCurrentPosX, setResizeCurrentPosX] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [titleContextMenu, setTitleContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [syncEvents, setSyncEvents] = useState<TimelineEventDto[] | null>(null);
  // Which target the open dialog is pointed at. Both dialogs share the header output menu, so
  // switching target swaps the dialog while keeping the same events selected. It opens on whatever
  // was exported to last time, which is what keeps a repeated export down to two clicks.
  const [syncOutput, setSyncOutput] = useState<string>(readLastSyncOutput);
  const { outputs: syncOutputs } = useSyncOutputs();
  const configuredOutputs = syncOutputs.filter((output) => output.isReady);
  const canExport = configuredOutputs.length > 0;

  // The remembered target may since have been removed, so fall back to the first one still set up
  // rather than opening a dialog for an integration that is no longer there.
  const openExport = (eventsToExport: TimelineEventDto[]) => {
    const isStillConfigured = configuredOutputs.some((output) => output.id === syncOutput);
    if (!isStillConfigured && configuredOutputs[0]) setSyncOutput(configuredOutputs[0].id);
    setSyncEvents(eventsToExport);
  };

  const handleSelectOutput = (outputId: string) => {
    setSyncOutput(outputId);
    writeLastSyncOutput(outputId);
  };
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [pendingCreate, setPendingCreate] = useState<{
    title: string;
    code: string;
    color: string;
  } | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    setTrackWidth(el.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      setTrackWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Membership is tested once per bar per render, so the list is turned into a set rather than
  // scanned for every event on the timeline.
  const selectedEventIdSet = useMemo(() => new Set(selectedEventIds), [selectedEventIds]);

  useEffect(() => {
    if (timelineInfo.timelineType !== TimelineType.Tag || !onDeleteTag) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      )
        return;
      const ownSelectedEvents = events.filter((ev) => selectedEventIdSet.has(ev.id));
      if (!ownSelectedEvents.length) return;
      ownSelectedEvents.forEach((ev) => onDeleteTag(ev.id));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timelineInfo.timelineType, onDeleteTag, selectedEventIdSet, events]);

  const lastSelectedEventIdRef = useRef<string | null>(null);

  const handleSelectEvent = (clickEvent: MouseEvent, event: TimelineEventDto) => {
    const ownSelectedIds = events.filter((ev) => selectedEventIdSet.has(ev.id)).map((ev) => ev.id);

    if (clickEvent.shiftKey && lastSelectedEventIdRef.current) {
      // Ranges run over the bars on screen, which is what the user drew the range across
      const anchorIndex = visibleEvents.findIndex((ev) => ev.id === lastSelectedEventIdRef.current);
      const clickedIndex = visibleEvents.findIndex((ev) => ev.id === event.id);
      if (anchorIndex !== -1 && clickedIndex !== -1) {
        const from = Math.min(anchorIndex, clickedIndex);
        const to = Math.max(anchorIndex, clickedIndex);
        setSelectedEventIds(
          visibleEvents.slice(from, to + 1).map((ev) => ev.id),
          timelineInfo
        );
        return;
      }
    }

    if (clickEvent.ctrlKey || clickEvent.metaKey) {
      const nextIds = ownSelectedIds.includes(event.id)
        ? ownSelectedIds.filter((id) => id !== event.id)
        : [...ownSelectedIds, event.id];
      lastSelectedEventIdRef.current = event.id;
      setSelectedEventIds(nextIds, timelineInfo);
      return;
    }

    lastSelectedEventIdRef.current = event.id;
    setSelectedEventIds([event.id], timelineInfo);
  };

  const lowerSearch = searchTerm.toLowerCase();

  const handleTitleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTitleContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleEditFromTitleContextMenu = () => {
    navigate(
      '/' +
        ROUTE_PARTS.manage +
        '/' +
        ROUTE_PARTS.timelines +
        '/' +
        timelineInfo.id +
        '/' +
        ROUTE_PARTS.edit
    );
  };

  const windowInMilliseconds = differenceInMilliseconds(maxTime, minTime);
  const windowStartMs = minTime.getTime();

  const snapContext: SnapContext = {
    snapTimesMs: snapPointTimesMs,
    windowStartMs,
    windowMs: windowInMilliseconds,
    trackWidthPx: trackWidth,
  };

  // Tags and auto tags are edited one by one — resizing, deleting and editing all need the bar to
  // stand for exactly one event — and there are few enough of them that merging buys nothing.
  const canMergeEvents =
    timelineInfo.timelineType !== TimelineType.Tag &&
    timelineInfo.timelineType !== TimelineType.AutoTag;

  // Only the bars that fall inside the zoomed window are rendered, and neighbouring bars that the
  // current zoom cannot keep apart are drawn as one. At day zoom this turns thousands of DOM
  // nodes into a couple of hundred without changing what the user sees.
  const visibleEvents = useMemo(
    () =>
      cullAndMergeEvents(
        events,
        windowStartMs,
        windowStartMs + windowInMilliseconds,
        trackWidth,
        canMergeEvents
      ),
    [events, windowStartMs, windowInMilliseconds, trackWidth, canMergeEvents]
  );

  // Floor for the bar width so a very short event still leaves a mark instead of vanishing
  const minWidthPercent = trackWidth > 0 ? (1 / trackWidth) * 100 : 0;

  const selectionStartTime = addMilliseconds(
    minTime,
    (windowInMilliseconds / 100) * (selectionPercentages?.start || 0)
  );
  const selectionEndTime = addMilliseconds(
    minTime,
    (windowInMilliseconds / 100) * (selectionPercentages?.end || 0)
  );

  const getMousePositionXPercent = (evt: MouseEvent) => {
    const timelineElement: HTMLDivElement | null = (evt.target as HTMLDivElement).closest(
      '.c-timeline__track'
    );
    if (!timelineElement) {
      return -1;
    }
    return ((evt.clientX - timelineElement.offsetLeft) / timelineElement.offsetWidth) * 100;
  };

  const handleMouseDown = (evt: MouseEvent) => {
    if (evt.button !== 0) return; // only left-click starts a selection
    // On tag timelines, don't start a selection drag when the user presses
    // down on an existing tag event (clicking still selects via onClick).
    if (timelineInfo.timelineType === TimelineType.Tag) {
      const existingEventEl = (evt.target as HTMLElement).closest('[data-event-id]');
      if (existingEventEl) return;
    }
    const posX = getMousePositionXPercent(evt);
    if (posX < 0 || posX > 100) {
      return;
    }
    onMouseDown(timelineInfo.id, applySnap(posX, snapContext));
  };

  const handleMouseMove = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);
    if (posX < 0 || posX > 100) {
      return;
    }
    if (resizeState) {
      setResizeCurrentPosX(applySnap(posX, snapContext));
      return;
    }
    const snapped = findSnap(posX, snapContext);
    onMouseMove(timelineInfo.id, snapped ?? posX, snapped);
  };

  const handleMouseUp = (evt: MouseEvent) => {
    if (resizeState && onTagResized) {
      const rawPosX = getMousePositionXPercent(evt);
      const posX = applySnap(
        rawPosX >= 0 && rawPosX <= 100 ? rawPosX : (resizeCurrentPosX ?? 0),
        snapContext
      );
      const originalEndMs = differenceInMilliseconds(
        parseISO(resizeState.originalEndedAt),
        minTime
      );
      const originalStartMs = differenceInMilliseconds(
        parseISO(resizeState.originalStartedAt),
        minTime
      );
      let newStartedAt = resizeState.originalStartedAt;
      let newEndedAt = resizeState.originalEndedAt;
      if (resizeState.side === 'start') {
        const clampedMs = Math.min((posX / 100) * windowInMilliseconds, originalEndMs - 60_000);
        newStartedAt = addMilliseconds(minTime, clampedMs).toISOString();
      } else {
        const clampedMs = Math.max((posX / 100) * windowInMilliseconds, originalStartMs + 60_000);
        newEndedAt = addMilliseconds(minTime, clampedMs).toISOString();
      }
      onTagResized(resizeState.tagId, newStartedAt, newEndedAt);
      setResizeState(null);
      setResizeCurrentPosX(null);
      return;
    }
    const posX = getMousePositionXPercent(evt);
    if (posX < 0 || posX > 100) {
      return;
    }
    const eventId: string | null =
      (evt.target as HTMLElement)?.getAttribute('data-event-id') || null;
    // Modifier clicks on an existing event are handled by the event's own
    // onClick (multi-select); don't let the mouse up reset the selection.
    if (
      (evt.ctrlKey || evt.metaKey || evt.shiftKey) &&
      (evt.target as HTMLElement)?.closest('[data-event-id]')
    ) {
      return;
    }
    onMouseUp(timelineInfo.id, applySnap(posX, snapContext), eventId);
  };

  const handleMouseLeave = () => {
    if (resizeState) {
      setResizeState(null);
      setResizeCurrentPosX(null);
    }
    onMouseLeaveProp?.();
  };

  const handleContextMenu = (e: MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Look the event up among the bars on screen, so acting on a merged bar covers the whole
    // stretch it represents rather than just the first event inside it.
    const event =
      visibleEvents.find((ev) => ev.id === eventId) ?? events.find((ev) => ev.id === eventId);
    if (!event) return;
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      eventId,
      event,
      eventStartedAt: event?.startedAt,
      eventEndedAt: event?.endedAt,
    });
  };

  const handleCopyEventToClipboard = (event: TimelineEventDto) => {
    const startStr = format(roundToNearestMinutes(parseISO(event.startedAt)), 'yyyy-MM-dd HH:mm');
    const endStr = format(roundToNearestMinutes(parseISO(event.endedAt)), 'HH:mm');
    const durationSec = differenceInSeconds(parseISO(event.endedAt), parseISO(event.startedAt));
    const durationStr = formatDuration(durationSec);
    const info = event.info as Record<string, unknown>;
    const infoLines = Object.entries(info)
      .filter(([, val]) => val !== '' && val !== null && val !== undefined)
      .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
      .join('\n');
    const text = [`Start: ${startStr}`, `End: ${endStr}`, `Duration: ${durationStr}`, '', infoLines]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleTagNameChange = async (newValue: TagName | null) => {
    if (!newValue || !selectionPercentages) {
      return;
    }
    if ((newValue as unknown as { __isNew__: boolean }).__isNew__) {
      const title = (newValue as unknown as { value: string }).value;
      const color = getRandomColor();
      setPendingCreate({ title, code: '', color });
    } else {
      await onCreateTag(newValue);
    }
  };

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return;
    const createdTagName = await onCreateTagName(pendingCreate);
    setPendingCreate(null);
    await onCreateTag(createdTagName);
  };

  // Derive a consistent dot color for the timeline label from its title (or use configured color)
  const timelineDotColor = timelineInfo.color
    ? timelineInfo.color
    : (events[0]?.color ?? getColorFromString(timelineInfo.title));

  const hourTicks = useMemo(() => getTicks(minTime, maxTime, 60), [minTime, maxTime]);
  const quarterTicks = useMemo(() => getTicks(minTime, maxTime, 15), [minTime, maxTime]);
  return (
    <>
      <div
        className={
          'c-timeline ' +
          (isActive ? 'c-timeline--active' : '') +
          (resizeState ? ' c-timeline--resizing' : '')
        }
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="c-timeline__title cursor-pointer"
          onClick={() => onSelectTimeline(timelineInfo.id)}
          onContextMenu={handleTitleContextMenu}
          style={{ borderLeft: `3px solid ${timelineDotColor}` }}
        >
          <span className="c-timeline__label">{timelineInfo.title}</span>
        </div>
        <div className="c-timeline__track" ref={trackRef}>
          {/* Hour and quarter ticks */}
          {quarterTicks.map((quarterTick) => (
            <div
              key={'c-timeline__quarter-tick-' + quarterTick.toISOString()}
              className="c-timeline__quarter-tick"
              style={{
                left:
                  (differenceInMilliseconds(quarterTick, minTime) / windowInMilliseconds) * 100 +
                  '%',
              }}
            ></div>
          ))}
          {hourTicks.map((hourTick) => (
            <div
              key={'c-timeline__hour-tick-' + hourTick.toISOString()}
              className="c-timeline__hour-tick"
              style={{
                left:
                  (differenceInMilliseconds(hourTick, minTime) / windowInMilliseconds) * 100 + '%',
              }}
            ></div>
          ))}

          {/* Current time tick */}
          {isAfter(new Date(), minTime) && isBefore(new Date(), maxTime) && (
            <div
              key={'c-timeline__current-time-' + timelineInfo.title}
              className="c-timeline__current-time"
              style={{
                left:
                  (differenceInMilliseconds(new Date(), minTime) / windowInMilliseconds) * 100 +
                  '%',
              }}
            />
          )}

          {/* Hover / snap indicator */}
          {hoverPercent !== null && (
            <div className="c-timeline__hover-indicator" style={{ left: hoverPercent + '%' }} />
          )}

          {/* Events */}
          {visibleEvents.map((event) => {
            const startPercent = ((event.startMs - windowStartMs) / windowInMilliseconds) * 100;
            const endPercent = ((event.endMs - windowStartMs) / windowInMilliseconds) * 100;

            // Apply visual override when this event is being resized
            let effectiveLeft = startPercent;
            let effectiveRight = endPercent;
            if (resizeState?.tagId === event.id && resizeCurrentPosX !== null) {
              if (resizeState.side === 'start') {
                effectiveLeft = Math.min(resizeCurrentPosX, endPercent - 0.1);
              } else {
                effectiveRight = Math.max(resizeCurrentPosX, startPercent + 0.1);
              }
            }

            const widthPercent = effectiveRight - effectiveLeft;
            // A bar thinner than a pixel would not show up at all, so it is nudged up to one
            const width = Math.max(widthPercent, minWidthPercent) + '%';
            const pixelWidth = (widthPercent / 100) * trackWidth;
            const isNarrow = pixelWidth <= 40;

            const { label, color, textColor, timeRange } = event;
            const isTagTimeline = timelineInfo.timelineType === TimelineType.Tag && !!onTagResized;
            const isDimmed = !!lowerSearch && !event.haystack.includes(lowerSearch);

            return (
              <Tooltip
                key={'c-timeline__' + timelineInfo.title + '__event__tippy__' + event.id}
                content={() => {
                  const eventInfo = event.info as Record<string, string | number | boolean>;
                  const isAutoTagTimeline = timelineInfo.timelineType === TimelineType.AutoTag;
                  const autoTagInfo = isAutoTagTimeline
                    ? (event.info as AutoTagEventInfoDto)
                    : null;
                  const matchedConditions = autoTagInfo?.matchedConditions ?? [];
                  const isProductiveTimeline =
                    timelineInfo.timelineType === TimelineType.Productive;
                  const merged = event.mergedFrom ? summarizeMergedEvents(event.mergedFrom) : null;
                  return (
                    <ul
                      className="c-timeline__event__tooltip"
                      key={'c-timeline__' + timelineInfo.title + '__event__tippy__ul__' + event.id}
                    >
                      <li>
                        <b>Date:</b>{' '}
                        {format(roundToNearestMinutes(parseISO(event.startedAt)), 'HH:mm')} -{' '}
                        {format(roundToNearestMinutes(parseISO(event.endedAt)), 'HH:mm')} (
                        {formatDuration(
                          differenceInSeconds(parseISO(event.endedAt), parseISO(event.startedAt))
                        )}
                        )
                      </li>
                      {merged && !!merged.entries.length && (
                        <li className="c-timeline__event__tooltip__conditions">
                          <b>Merged {event.mergedFrom!.length} events:</b>
                          <ul>
                            {merged.entries.map((entry) => (
                              <li key={'c-timeline__merged__' + event.id + '__' + entry.detail}>
                                {entry.detail} (
                                {formatDuration(Math.round(entry.durationMs / 1000))})
                              </li>
                            ))}
                            {!!merged.remaining && <li>and {merged.remaining} more</li>}
                          </ul>
                        </li>
                      )}
                      {isTagTimeline ? (
                        <>
                          <li>
                            <b>Name:</b> {label}
                          </li>
                          {(event.info as any).note && (
                            <li>
                              <b>Note:</b> {(event.info as any).note}
                            </li>
                          )}
                        </>
                      ) : isAutoTagTimeline ? (
                        <>
                          <li>
                            <b>Title:</b> {String(eventInfo['tagNameTitle'] ?? '')}
                          </li>
                          <li>
                            <b>Priority:</b> {String(eventInfo['priority'] ?? '')}
                          </li>
                          {autoTagInfo?.tagNameNote && (
                            <li>
                              <b>Note:</b> {autoTagInfo.tagNameNote}
                            </li>
                          )}
                          {!!matchedConditions.length && (
                            <li className="c-timeline__event__tooltip__conditions">
                              <b>{matchedConditions.length > 1 ? 'Conditions' : 'Condition'}:</b>
                              <ul>
                                {matchedConditions.map((condition, conditionIndex) => (
                                  <li
                                    key={
                                      'c-timeline__' +
                                      timelineInfo.title +
                                      '__event__' +
                                      event.id +
                                      '__condition__' +
                                      conditionIndex
                                    }
                                  >
                                    {formatMatchedCondition(condition)}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          )}
                        </>
                      ) : isProductiveTimeline ? (
                        <>
                          <li>
                            <b>Note:</b> {String(eventInfo['tagNameName'] ?? '')}
                          </li>
                          {eventInfo['serviceName'] && (
                            <li>
                              <b>Service:</b> {String(eventInfo['serviceName'])}
                            </li>
                          )}
                          {eventInfo['serviceProject'] && (
                            <li>
                              <b>Project:</b> {String(eventInfo['serviceProject'])}
                            </li>
                          )}
                          {eventInfo['dealName'] && (
                            <li>
                              <b>Deal:</b> {String(eventInfo['dealName'])}
                            </li>
                          )}
                          {eventInfo['companyName'] && (
                            <li>
                              <b>Company:</b> {String(eventInfo['companyName'])}
                            </li>
                          )}
                        </>
                      ) : (
                        Object.keys(eventInfo)
                          .filter((key) => {
                            const val = eventInfo[key];
                            if (val === '' || val === null || val === undefined) return false;
                            if (key === 'allDay' && val === false) return false;
                            return true;
                          })
                          .map((key) => (
                            <li
                              key={
                                'c-timeline__' +
                                timelineInfo.title +
                                '__event__' +
                                event.startedAt +
                                '__info__' +
                                key +
                                '__' +
                                eventInfo[key]
                              }
                            >
                              <b>{key}</b>:{' '}
                              {typeof eventInfo[key] === 'boolean'
                                ? eventInfo[key]
                                  ? 'active'
                                  : 'inactive'
                                : eventInfo[key]}
                            </li>
                          ))
                      )}
                    </ul>
                  );
                }}
              >
                <div
                  className={
                    'c-timeline__event' +
                    (selectedEventIdSet.has(event.id) ? ' c-timeline__event--selected' : '') +
                    (isNarrow ? ' c-timeline__event--narrow' : '') +
                    (isDimmed ? ' c-timeline__event--dimmed' : '')
                  }
                  data-event-id={event.id}
                  key={'c-timeline__' + timelineInfo.title + '__event__div__' + event.id}
                  style={{
                    left: effectiveLeft + '%',
                    width,
                    backgroundColor: color + '33',
                    borderLeft: `3px solid ${color}`,
                  }}
                  onClick={(clickEvent) => {
                    handleSelectEvent(clickEvent, event);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, event.id)}
                >
                  {!isNarrow && (
                    <div className="c-timeline__event-content">
                      <span className="c-timeline__event-label" style={{ color: textColor }}>
                        {label}
                      </span>
                      <span className="c-timeline__event-time">{timeRange}</span>
                    </div>
                  )}
                  {isTagTimeline && (
                    <>
                      <div
                        className="c-timeline__event-resize-handle c-timeline__event-resize-handle--start"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeState({
                            tagId: event.id,
                            side: 'start',
                            originalStartedAt: event.startedAt,
                            originalEndedAt: event.endedAt,
                          });
                          setResizeCurrentPosX(startPercent);
                        }}
                      />
                      <div
                        className="c-timeline__event-resize-handle c-timeline__event-resize-handle--end"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeState({
                            tagId: event.id,
                            side: 'end',
                            originalStartedAt: event.startedAt,
                            originalEndedAt: event.endedAt,
                          });
                          setResizeCurrentPosX(endPercent);
                        }}
                      />
                    </>
                  )}
                </div>
              </Tooltip>
            );
          })}

          {/* Selection */}
          {selectionPercentages && (
            <Tooltip
              key={'c-timeline__' + timelineInfo.title + '__selection__tippy'}
              className="c-timeline__selection__tooltip--ended"
              content={
                <ul
                  onMouseMove={(evt) => evt.stopPropagation()}
                  onMouseDown={(evt) => evt.stopPropagation()}
                  onMouseUp={(evt) => evt.stopPropagation()}
                  key={'c-timeline__' + timelineInfo.title + '__selection__tippy__ul'}
                >
                  <li>
                    {format(roundToNearestMinutes(selectionStartTime), 'HH:mm')} -{' '}
                    {format(roundToNearestMinutes(selectionEndTime), 'HH:mm')}
                  </li>
                  <li>
                    {formatDuration(differenceInSeconds(selectionEndTime, selectionStartTime))}
                  </li>
                  <TagSelectSingle value={null} onChange={handleTagNameChange} autoFocus />
                </ul>
              }
              visible={
                !!selectionPercentages.start &&
                !!selectionPercentages.end &&
                !selectedEventIds.length
              }
              placement="top-end"
            >
              <div
                className="c-timeline__selection"
                key={'c-timeline__' + timelineInfo.title + '__selection'}
                style={{
                  left: selectionPercentages.start + '%',
                  right: 100 - selectionPercentages.end + '%',
                }}
              ></div>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          items={[
            ...(timelineInfo.timelineType === TimelineType.AutoTag
              ? // Manual tags shown on an auto tag timeline have no rule behind them
                (contextMenu.event.info as AutoTagEventInfoDto)?.autoTagId
                ? [
                    {
                      label: 'Edit rule',
                      onClick: () =>
                        onEditAutoTagRule?.(
                          (contextMenu.event.info as AutoTagEventInfoDto).autoTagId
                        ),
                    },
                  ]
                : []
              : timelineInfo.timelineType === TimelineType.Tag
                ? [
                    { label: 'Edit tag', onClick: () => onEditTag?.(contextMenu.eventId) },
                    {
                      label: 'Delete tag',
                      onClick: () => onDeleteTag?.(contextMenu.eventId),
                      variant: 'danger' as const,
                    },
                  ]
                : []),
            ...(timelineInfo.timelineType === TimelineType.AutoTag
              ? // An auto tag already carries its tag name, note and time range,
                // so the tag is created straight away without asking for anything else
                onCreateTagFromAutoTagEvent &&
                (contextMenu.event.info as AutoTagEventInfoDto)?.tagNameId
                ? [
                    {
                      label: 'Create tag',
                      onClick: () => onCreateTagFromAutoTagEvent(contextMenu.event),
                    },
                  ]
                : []
              : onCreateTagFromEvent && contextMenu.eventStartedAt && contextMenu.eventEndedAt
                ? [
                    {
                      label: 'Create tag',
                      onClick: () =>
                        onCreateTagFromEvent(
                          contextMenu.eventStartedAt!,
                          contextMenu.eventEndedAt!
                        ),
                    },
                  ]
                : []),
            ...(onCreateAutoTagRuleFromEvent &&
            timelineInfo.timelineType !== TimelineType.Tag &&
            timelineInfo.timelineType !== TimelineType.AutoTag
              ? [
                  {
                    label: 'Create autotag rule',
                    onClick: () => {
                      const conditions = getMostProminentConditions(
                        timelineInfo,
                        contextMenu.event
                      );
                      onCreateAutoTagRuleFromEvent(conditions);
                    },
                  },
                ]
              : []),
            ...(timelineInfo.timelineType === TimelineType.AutoTag && onGrowAutoTags
              ? [
                  {
                    label: 'Grow auto tags',
                    onClick: () => {
                      setContextMenu(null);
                      onGrowAutoTags();
                    },
                  },
                ]
              : []),
            ...((timelineInfo.timelineType === TimelineType.Tag ||
              timelineInfo.timelineType === TimelineType.AutoTag) &&
            (contextMenu.event.info as AutoTagEventInfoDto)?.tagNameId &&
            canExport
              ? [
                  {
                    label: 'Export',
                    onClick: () => {
                      const event = contextMenu.event;
                      setContextMenu(null);
                      openExport([event]);
                    },
                  },
                ]
              : []),
            {
              label: 'Copy to clipboard',
              onClick: () => handleCopyEventToClipboard(contextMenu.event),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Title context menu */}
      {titleContextMenu && (
        <ContextMenu
          position={titleContextMenu}
          items={[
            { label: 'Edit timeline', onClick: handleEditFromTitleContextMenu },
            ...(timelineInfo.timelineType === TimelineType.AutoTag && onGrowAutoTags
              ? [
                  {
                    label: 'Grow auto tags',
                    onClick: () => {
                      setTitleContextMenu(null);
                      onGrowAutoTags();
                    },
                  },
                ]
              : []),
            ...(onRefreshEvents
              ? [
                  {
                    label: 'Refresh events',
                    onClick: () => {
                      setTitleContextMenu(null);
                      onRefreshEvents();
                    },
                  },
                ]
              : []),
            ...((timelineInfo.timelineType === TimelineType.Tag ||
              timelineInfo.timelineType === TimelineType.AutoTag) &&
            canExport
              ? [
                  {
                    label: 'Export',
                    onClick: () => {
                      setTitleContextMenu(null);
                      openExport(events);
                    },
                  },
                ]
              : []),
          ]}
          onClose={() => setTitleContextMenu(null)}
        />
      )}

      {/* Create tag name modal */}
      <Modal
        open={!!pendingCreate}
        onClose={() => setPendingCreate(null)}
        classNames={{ modal: 'c-edit-tag-name-modal', closeButton: 'c-button c-button--small' }}
      >
        <h3>Add tag name</h3>
        <div className="c-form">
          <h4 className="mt-4">Name</h4>
          <input
            className="c-input"
            value={pendingCreate?.title ?? ''}
            onChange={(e) => setPendingCreate((prev) => prev && { ...prev, title: e.target.value })}
          />
          <h4 className="mt-4">Code</h4>
          <input
            className="c-input"
            value={pendingCreate?.code ?? ''}
            onChange={(e) => setPendingCreate((prev) => prev && { ...prev, code: e.target.value })}
          />
          <h4 className="mt-4">Color</h4>
          {pendingCreate && (
            <ColorInput
              color={pendingCreate.color}
              onChange={(color) => setPendingCreate((prev) => prev && { ...prev, color })}
            />
          )}
        </div>
        <div className="flex flex-row justify-end gap-2 mt-48">
          <Button onClick={() => setPendingCreate(null)} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button
            disabled={!pendingCreate?.title || !pendingCreate?.color}
            onClick={handleConfirmCreate}
            variant={ButtonVariant.Primary}
          >
            Save
          </Button>
        </div>
      </Modal>

      {/* Sync dialogs — one per output, sharing the header menu that switches between them. */}
      <SyncToProductiveModal
        open={!!syncEvents && syncOutput === PRODUCTIVE_OUTPUT_ID}
        onClose={() => setSyncEvents(null)}
        date={format(minTime, 'yyyy-MM-dd')}
        timelineType={timelineInfo.timelineType}
        events={syncEvents ?? []}
        onSelectOutput={handleSelectOutput}
      />

      <ExportToCsvModal
        open={!!syncEvents && syncOutput === CSV_OUTPUT_ID}
        onClose={() => setSyncEvents(null)}
        date={format(minTime, 'yyyy-MM-dd')}
        timelineType={timelineInfo.timelineType}
        timelineTitle={timelineInfo.title}
        events={syncEvents ?? []}
        onSelectOutput={handleSelectOutput}
      />
    </>
  );
}

export default React.memo(Timeline);
