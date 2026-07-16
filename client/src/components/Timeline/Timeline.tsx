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
import type { TimelineDto, TimelineEventDto } from '../../generated/api/types.gen';
import { getColorForEvent, getColorFromString, getDarkerTextColor, getRandomColor } from './helpers/getColorForEvent';
import { getTicks } from './helpers/getTicks';
import { getEventLabel } from './helpers/getEventLabel';
import {
  getMostProminentConditions,
  type ProminentCondition,
} from './helpers/getMostProminentConditions';
import { TimelineType } from './Timeline.types';
import { ColorInput } from '../ColorInput/ColorInput';
import { SyncToProductiveModal } from '../SyncToProductiveModal/SyncToProductiveModal';

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
  events: TimelineEventDto[];
  minTime: Date;
  maxTime: Date;
  onMouseDown: (timelineId: string, posX: number) => void;
  onMouseMove: (timelineId: string, posX: number, hoverPosX: number | null) => void;
  onMouseUp: (timelineId: string, posX: number, eventId: string | null) => void;
  onMouseLeave?: () => void;
  selectionPercentages: { start: number; end: number } | null;
  snapPointPercents: number[];
  hoverPercent: number | null;
  onCreateTagName: (data: { title: string; code: string; color: string }) => Promise<TagName>;
  onCreateTag: (tagNameId: string) => Promise<void>;
  selectedEvent: TimelineEventDto | null;
  setSelectedEvent: (event: TimelineEventDto, timeline: TimelineDto) => void;
  isActive: boolean;
  onSelectTimeline: (timelineId: string) => void;
  onTagResized?: (tagId: string, newStartedAt: string, newEndedAt: string) => void;
  onDeleteTag?: (tagId: string) => void;
  onEditTag?: (tagId: string) => void;
  onEditAutoTagRule?: (autoTagId: string) => void;
  onCreateTagFromEvent?: (startedAt: string, endedAt: string) => void;
  onCreateAutoTagRuleFromEvent?: (conditions: ProminentCondition[]) => void;
  onRefreshEvents?: () => void;
}

function findSnap(posX: number, snapPoints: number[], trackWidthPx: number): number | null {
  if (trackWidthPx === 0 || snapPoints.length === 0) return null;
  const thresholdPercent = (10 / trackWidthPx) * 100;
  let closestDist = Infinity;
  let closestSnap = posX;
  for (const snap of snapPoints) {
    const dist = Math.abs(posX - snap);
    if (dist < closestDist) {
      closestDist = dist;
      closestSnap = snap;
    }
  }
  return closestDist <= thresholdPercent ? closestSnap : null;
}

function applySnap(posX: number, snapPoints: number[], trackWidthPx: number): number {
  return findSnap(posX, snapPoints, trackWidthPx) ?? posX;
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
  snapPointPercents,
  hoverPercent,
  onCreateTagName,
  onCreateTag,
  selectedEvent,
  setSelectedEvent,
  isActive,
  onSelectTimeline,
  onTagResized,
  onDeleteTag,
  onEditTag,
  onEditAutoTagRule,
  onCreateTagFromEvent,
  onCreateAutoTagRuleFromEvent,
  onRefreshEvents,
}: TimelineProps) {
  const navigate = useNavigate();
  const [searchTerm] = useAtom(searchTermAtom);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [resizeCurrentPosX, setResizeCurrentPosX] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [titleContextMenu, setTitleContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [pendingCreate, setPendingCreate] = useState<{ title: string; code: string; color: string } | null>(null);

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
      if (!selectedEvent) return;
      if (!events.some((ev) => ev.id === selectedEvent.id)) return;
      onDeleteTag(selectedEvent.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timelineInfo.timelineType, onDeleteTag, selectedEvent, events]);

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
    onMouseDown(timelineInfo.id, applySnap(posX, snapPointPercents, trackWidth));
  };

  const handleMouseMove = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);
    if (posX < 0 || posX > 100) {
      return;
    }
    if (resizeState) {
      setResizeCurrentPosX(applySnap(posX, snapPointPercents, trackWidth));
      return;
    }
    const snapped = findSnap(posX, snapPointPercents, trackWidth);
    onMouseMove(timelineInfo.id, snapped ?? posX, snapped);
  };

  const handleMouseUp = (evt: MouseEvent) => {
    if (resizeState && onTagResized) {
      const rawPosX = getMousePositionXPercent(evt);
      const posX = applySnap(
        rawPosX >= 0 && rawPosX <= 100 ? rawPosX : (resizeCurrentPosX ?? 0),
        snapPointPercents,
        trackWidth
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
    onMouseUp(timelineInfo.id, applySnap(posX, snapPointPercents, trackWidth), eventId);
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
    const isAutoTag = timelineInfo.timelineType === TimelineType.AutoTag && !!onEditAutoTagRule;
    const event = events.find((ev) => ev.id === eventId);
    if (!event) return;
    if (isAutoTag) {
      const autoTagId = (event?.info as { autoTagId?: string })?.autoTagId;
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        eventId: autoTagId ?? eventId,
        event,
        eventStartedAt: event?.startedAt,
        eventEndedAt: event?.endedAt,
      });
      return;
    }
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
      .map(([key, val]) => `${key}: ${val}`)
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
      await onCreateTag(newValue.id);
    }
  };

  const handleConfirmCreate = async () => {
    if (!pendingCreate) return;
    const createdTagName = await onCreateTagName(pendingCreate);
    setPendingCreate(null);
    await onCreateTag(createdTagName.id);
  };

  // Derive a consistent dot color for the timeline label from its title (or use configured color)
  const timelineDotColor = timelineInfo.color
    ? timelineInfo.color
    : events[0]
      ? getColorForEvent(timelineInfo, events[0])
      : getColorFromString(timelineInfo.title);

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
            <div
              className="c-timeline__hover-indicator"
              style={{ left: hoverPercent + '%' }}
            />
          )}

          {/* Events */}
          {events.map((event) => {
            const startPercent =
              (differenceInMilliseconds(parseISO(event.startedAt), minTime) /
                windowInMilliseconds) *
              100;
            const endPercent =
              (differenceInMilliseconds(parseISO(event.endedAt), minTime) / windowInMilliseconds) *
              100;

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
            const width = widthPercent + '%';
            const pixelWidth = (widthPercent / 100) * trackWidth;
            const isNarrow = pixelWidth <= 40;

            const eventInfo = event.info as Record<string, string | number | boolean>;
            const label = getEventLabel(timelineInfo, event);
            const timeRange = `${format(parseISO(event.startedAt), 'HH:mm')} - ${format(parseISO(event.endedAt), 'HH:mm')}`;
            const color = getColorForEvent(timelineInfo, event);
            const isTagTimeline = timelineInfo.timelineType === TimelineType.Tag && !!onTagResized;
            const isAutoTagTimeline = timelineInfo.timelineType === TimelineType.AutoTag;
            const isProductiveTimeline = timelineInfo.timelineType === TimelineType.Productive;
            const isDimmed =
              !!lowerSearch && !JSON.stringify(event).toLowerCase().includes(lowerSearch);

            return (
              <Tooltip
                key={'c-timeline__' + timelineInfo.title + '__event__tippy__' + event.id}
                content={
                  <ul
                    className="c-timeline__event__tooltip"
                    key={
                      'c-timeline__' + timelineInfo.title + '__event__tippy__ul__' + event.id
                    }
                  >
                    <li>
                      <b>Date:</b> {format(roundToNearestMinutes(parseISO(event.startedAt)), 'HH:mm')} -{' '}
                      {format(roundToNearestMinutes(parseISO(event.endedAt)), 'HH:mm')} (
                      {formatDuration(
                        differenceInSeconds(parseISO(event.endedAt), parseISO(event.startedAt))
                      )}
                      )
                    </li>
                    {isTagTimeline ? (
                      <>
                        <li>
                          <b>Name:</b> {getEventLabel(timelineInfo, event)}
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
                          <b>Code:</b> {String(eventInfo['tagNameCode'] ?? '')}
                        </li>
                        <li>
                          <b>Priority:</b> {String(eventInfo['priority'] ?? '')}
                        </li>
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
                }
              >
                <div
                  className={
                    'c-timeline__event' +
                    (selectedEvent?.id === event.id ? ' c-timeline__event--selected' : '') +
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
                  onClick={() => {
                    setSelectedEvent(event, timelineInfo);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, event.id)}
                >
                  {!isNarrow && (
                    <div className="c-timeline__event-content">
                      <span className="c-timeline__event-label" style={{ color: getDarkerTextColor(color) }}>
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
              visible={!!selectionPercentages.start && !!selectionPercentages.end && !selectedEvent}
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
              ? [{ label: 'Edit rule', onClick: () => onEditAutoTagRule?.(contextMenu.eventId) }]
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
            ...(onCreateTagFromEvent && contextMenu.eventStartedAt && contextMenu.eventEndedAt
              ? [
                  {
                    label: 'Create tag',
                    onClick: () =>
                      onCreateTagFromEvent(contextMenu.eventStartedAt!, contextMenu.eventEndedAt!),
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
                      const conditions = getMostProminentConditions(timelineInfo, contextMenu.event);
                      onCreateAutoTagRuleFromEvent(conditions);
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
            ...(onRefreshEvents
              ? [{ label: 'Refresh events', onClick: () => { setTitleContextMenu(null); onRefreshEvents(); } }]
              : []),
            ...(timelineInfo.timelineType === TimelineType.Tag ||
            timelineInfo.timelineType === TimelineType.AutoTag
              ? [{ label: 'Sync', onClick: () => { setTitleContextMenu(null); setSyncModalOpen(true); } }]
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

      {/* Sync to Productive modal */}
      <SyncToProductiveModal
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        date={format(minTime, 'yyyy-MM-dd')}
        timelineType={timelineInfo.timelineType}
        events={events}
      />
    </>
  );
}

export default React.memo(Timeline);
