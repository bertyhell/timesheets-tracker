import './Timeline.css';
import React, { type MouseEvent } from 'react';
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
import { type ActionMeta, type MultiValue, type OnChangeValue } from 'react-select';
import TagSelectMulti from '../TagSelect/TagSelectMulti';
import type { TimelineDto, TimelineEventDto } from '../../generated/api/types.gen';
import { getColorForEvent, getColorFromString } from './helpers/getColorForEvent';
import { getTicks } from './helpers/getTicks';
import { getEventLabel } from './helpers/getEventLabel';

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
}: TimelineProps) {
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
    onMouseMove(posX);
  };

  const handleMouseUp = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);
    if (posX < 0 || posX > 100) {
      return;
    }
    console.log('mouse up ', posX);
    const eventId: string | null =
      (evt.target as HTMLElement)?.getAttribute('data-event-id') || null;
    onMouseUp(posX, eventId);
  };

  const handleTagNameChange = async (
    option: OnChangeValue<TagName, true> | { label: string; value: string }[],
    actionMeta: ActionMeta<TagName>
  ) => {
    if (!option) {
      return;
    }
    switch (actionMeta.action) {
      case 'create-option': {
        if (!selectionPercentages) {
          return;
        }
        const newTagName: TagName = await onCreateTagName(
          (option as { label: string; value: string }[])?.[0]?.value
        );
        await onCreateTag(newTagName.id);
        break;
      }

      case 'select-option': {
        const tagNameId = (option as MultiValue<TagName>)?.[0]?.id;
        await onCreateTag(tagNameId);
        break;
      }
    }
  };

  // Derive a consistent dot color for the timeline label from its title
  const timelineDotColor = events[0]
    ? getColorForEvent(timelineInfo, events[0])
    : getColorFromString(timelineInfo.title);

  const hourTicks = getTicks(minTime, maxTime, 60);
  const quarterTicks = getTicks(minTime, maxTime, 15);
  return (
    <div
      className={'c-timeline ' + (isActive ? 'c-timeline--active' : '')}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="c-timeline__title cursor-pointer">
        <span className="c-timeline__dot" style={{ backgroundColor: timelineDotColor }} />
        <span className="c-timeline__label">{timelineInfo.title}</span>
      </div>
      <div className="c-timeline__track">
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
          const widthPercent =
            (differenceInMilliseconds(parseISO(event.endedAt), parseISO(event.startedAt)) /
              windowInMilliseconds) *
            100;
          const width = widthPercent + '%';
          const isNarrow = widthPercent < 5;

          const eventInfo = event.info as Record<string, string | number | boolean>;
          const label = getEventLabel(timelineInfo, event);
          const timeRange = `${format(parseISO(event.startedAt), 'HH:mm')} - ${format(parseISO(event.endedAt), 'HH:mm')}`;
          const color = getColorForEvent(timelineInfo, event);

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
                    {format(parseISO(event.endedAt), 'HH:mm:ss')}
                  </li>
                  {Object.keys(eventInfo).map((key) => (
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
                      <b>{key}</b>: {eventInfo[key]}
                    </li>
                  ))}
                </ul>
              }
            >
              <div
                className={
                  'c-timeline__event' +
                  (selectedEvent?.id === event.id ? ' c-timeline__event--selected' : '') +
                  (isNarrow ? ' c-timeline__event--narrow' : '')
                }
                data-event-id={event.id}
                key={'c-timeline__' + timelineInfo.title + '__event__div__' + event.startedAt}
                style={{
                  left:
                    (differenceInMilliseconds(parseISO(event.startedAt), minTime) /
                      windowInMilliseconds) *
                      100 +
                    '%',
                  width,
                  backgroundColor: color + '33',
                  borderLeft: `3px solid ${color}`,
                }}
                onClick={() => {
                  setSelectedEvent(event, timelineInfo);
                }}
              >
                {!isNarrow && (
                  <div className="c-timeline__event-content">
                    <span className="c-timeline__event-label" style={{ color }}>
                      {label}
                    </span>
                    <span className="c-timeline__event-time">{timeRange}</span>
                  </div>
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
                <TagSelectMulti onChange={handleTagNameChange} />
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
  );
}

export default Timeline;
