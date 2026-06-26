import './Timeline.css';
import React, { type MouseEvent, useEffect, useRef, useState } from 'react';

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
} from 'date-fns';
import { formatDuration } from '../../helpers/format-duration';
import type { TagName } from '../../types/types';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import type { TimelineDto, TimelineEventDto } from '../../generated/api/types.gen';
import { getColorForEvent, getColorFromString } from './helpers/getColorForEvent';
import { getTicks } from './helpers/getTicks';
import { getEventLabel } from './helpers/getEventLabel';
import { TimelineType } from './Timeline.types';

interface ResizeState {
  tagId: string;
  side: 'start' | 'end';
  originalStartedAt: string;
  originalEndedAt: string;
}

interface TimelineProps {
  timelineInfo: TimelineDto;
  events: TimelineEventDto[];
  minTime: Date;
  maxTime: Date;
  onMouseDown: (posX: number) => void;
  onMouseMove: (posX: number) => void;
  onMouseUp: (posX: number, eventId: string | null) => void;
  selectionPercentages: { start: number; end: number } | null;
  onCreateTagName: (name: string) => Promise<TagName>;
  onCreateTag: (tagNameId: string) => Promise<void>;
  selectedEvent: TimelineEventDto | null;
  setSelectedEvent: (event: TimelineEventDto, timeline: TimelineDto) => void;
  isActive: boolean;
  onSelectTimeline: () => void;
  onTagResized?: (tagId: string, newStartedAt: string, newEndedAt: string) => void;
  onDeleteTag?: (tagId: string) => void;
  onEditTag?: (tagId: string) => void;
  onEditAutoTagRule?: (autoTagId: string) => void;
}

function Timeline({
  timelineInfo,
  events,
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
  isActive,
  onSelectTimeline,
  onTagResized,
  onDeleteTag,
  onEditTag,
  onEditAutoTagRule,
}: TimelineProps) {
  const navigate = useNavigate();
  const [searchTerm] = useAtom(searchTermAtom);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [resizeCurrentPosX, setResizeCurrentPosX] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; eventId: string } | null>(null);
  const [titleContextMenu, setTitleContextMenu] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

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

  const lowerSearch = searchTerm.toLowerCase();

  const handleTitleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTitleContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleEditFromTitleContextMenu = () => {
    navigate(
      '/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.timelines + '/' + timelineInfo.id + '/' + ROUTE_PARTS.edit
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
    onMouseDown(posX);
  };

  const handleMouseMove = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);
    if (posX < 0 || posX > 100) {
      return;
    }
    if (resizeState) {
      setResizeCurrentPosX(posX);
      return;
    }
    onMouseMove(posX);
  };

  const handleMouseUp = (evt: MouseEvent) => {
    if (resizeState && onTagResized) {
      const rawPosX = getMousePositionXPercent(evt);
      const posX = rawPosX >= 0 && rawPosX <= 100 ? rawPosX : (resizeCurrentPosX ?? 0);
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
    console.log('mouse up ', posX);
    const eventId: string | null =
      (evt.target as HTMLElement)?.getAttribute('data-event-id') || null;
    onMouseUp(posX, eventId);
  };

  const handleMouseLeave = () => {
    if (resizeState) {
      setResizeState(null);
      setResizeCurrentPosX(null);
    }
  };

  const handleContextMenu = (e: MouseEvent, eventId: string) => {
    const isTag = timelineInfo.timelineType === TimelineType.Tag && (!!onDeleteTag || !!onEditTag);
    const isAutoTag = timelineInfo.timelineType === TimelineType.AutoTag && !!onEditAutoTagRule;
    if (!isTag && !isAutoTag) return;
    e.preventDefault();
    e.stopPropagation();
    if (isAutoTag) {
      const event = events.find((ev) => ev.id === eventId);
      const autoTagId = (event?.info as { autoTagId?: string })?.autoTagId;
      if (autoTagId) {
        setContextMenu({ x: e.clientX, y: e.clientY, eventId: autoTagId });
      }
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY, eventId });
  };

  const handleTagNameChange = async (newValue: TagName | null) => {
    if (!newValue || !selectionPercentages) {
      return;
    }
    if ((newValue as unknown as { __isNew__: boolean }).__isNew__) {
      // User typed a new tag name — create it first, then create the tag
      const createdTagName = await onCreateTagName(
        (newValue as unknown as { value: string }).value
      );
      await onCreateTag(createdTagName.id);
    } else {
      await onCreateTag(newValue.id);
    }
  };

  // Derive a consistent dot color for the timeline label from its title (or use configured color)
  const timelineDotColor = timelineInfo.color
    ? timelineInfo.color
    : events[0]
      ? getColorForEvent(timelineInfo, events[0])
      : getColorFromString(timelineInfo.title);

  const hourTicks = getTicks(minTime, maxTime, 60);
  const quarterTicks = getTicks(minTime, maxTime, 15);
  return (
    <>
    <div
      className={'c-timeline ' + (isActive ? 'c-timeline--active' : '') + (resizeState ? ' c-timeline--resizing' : '')}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="c-timeline__title cursor-pointer" onClick={onSelectTimeline} onContextMenu={handleTitleContextMenu}>
        <span className="c-timeline__dot" style={{ backgroundColor: timelineDotColor }} />
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
                (differenceInMilliseconds(quarterTick, minTime) / windowInMilliseconds) * 100 + '%',
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
                (differenceInMilliseconds(new Date(), minTime) / windowInMilliseconds) * 100 + '%',
            }}
          />
        )}

        {/* Events */}
        {events.map((event) => {
          const startPercent =
            (differenceInMilliseconds(parseISO(event.startedAt), minTime) /
              windowInMilliseconds) *
            100;
          const endPercent =
            (differenceInMilliseconds(parseISO(event.endedAt), minTime) /
              windowInMilliseconds) *
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
          const isTagTimeline =
            timelineInfo.timelineType === TimelineType.Tag && !!onTagResized;
          const isAutoTagTimeline =
            timelineInfo.timelineType === TimelineType.AutoTag;
          const isDimmed = !!lowerSearch && !JSON.stringify(event).toLowerCase().includes(lowerSearch);

          return (
            <Tooltip
              key={'c-timeline__' + timelineInfo.title + '__event__tippy__' + event.startedAt}
              content={
                <ul
                  className="c-timeline__event__tooltip"
                  key={
                    'c-timeline__' + timelineInfo.title + '__event__tippy__ul__' + event.startedAt
                  }
                >
                  <li>
                    <b>Date:</b> {format(parseISO(event.startedAt), 'HH:mm:ss')} -{' '}
                    {format(parseISO(event.endedAt), 'HH:mm:ss')} (
                    {formatDuration(
                      differenceInSeconds(parseISO(event.endedAt), parseISO(event.startedAt))
                    )}
                    )
                  </li>
                  {isTagTimeline ? (
                    <li>
                      <b>Name:</b> {getEventLabel(timelineInfo, event)}
                    </li>
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
                key={'c-timeline__' + timelineInfo.title + '__event__div__' + event.startedAt}
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
                    <span className="c-timeline__event-label" style={{ color }}>
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
                  {format(selectionStartTime, 'HH:mm:ss')} - {format(selectionEndTime, 'HH:mm:ss')}
                </li>
                <li>{formatDuration(differenceInSeconds(selectionEndTime, selectionStartTime))}</li>
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
        items={
          timelineInfo.timelineType === TimelineType.AutoTag
            ? [{ label: 'Edit rule', onClick: () => onEditAutoTagRule?.(contextMenu.eventId) }]
            : [
                { label: 'Edit tag', onClick: () => onEditTag?.(contextMenu.eventId) },
                { label: 'Delete tag', onClick: () => onDeleteTag?.(contextMenu.eventId), variant: 'danger' },
              ]
        }
        onClose={() => setContextMenu(null)}
      />
    )}

    {/* Title context menu */}
    {titleContextMenu && (
      <ContextMenu
        position={titleContextMenu}
        items={[{ label: 'Edit timeline', onClick: handleEditFromTitleContextMenu }]}
        onClose={() => setTitleContextMenu(null)}
      />
    )}
    </>
  );
}

export default Timeline;
