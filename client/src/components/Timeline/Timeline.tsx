import './Timeline.scss';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import React, { type MouseEvent } from 'react';
import {
  addHours,
  addMilliseconds,
  addMinutes,
  differenceInMilliseconds,
  differenceInSeconds,
  endOfHour,
  format,
  isAfter,
  isBefore,
  parseISO,
  roundToNearestMinutes,
} from 'date-fns';
import { formatDuration } from '../../helpers/format-duration';
import type { TagName } from '../../types/types';
import { type ActionMeta, type MultiValue, type OnChangeValue } from 'react-select';
import TagSelectMulti from '../TagSelect/TagSelectMulti';
import { TimelineDto, TimelineEventDto } from '../../generated/api/requests';
import { getColorForEvent } from './helpers/getColorForEvent';

interface TimelineProps {
  timelineInfo: TimelineDto;
  events: TimelineEventDto[];
  minTime: Date;
  maxTime: Date;
  onMouseDown: (posX: number) => void;
  onMouseMove: (posX: number) => void;
  onMouseUp: (posX: number) => void;
  selectionPercentages: { start: number; end: number } | null;
  onCreateTagName: (name: string) => Promise<TagName>;
  onCreateTag: (tagNameId: string) => Promise<void>;
  selectedEvent: TimelineEventDto | null;
  setSelectedEvent: (event: TimelineEventDto, timeline: TimelineDto) => void;
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

  /**
   * Returns all dates to place lines at. eg: every 60 minutes or every 15 minutes
   * @param minTime
   * @param maxTime
   * @param interval 30 or 15 or 5
   */
  const getTicks = (minTime: Date, maxTime: Date, interval: number) => {
    const ticks: Date[] = [];
    if (interval === 60) {
      let nextTick = endOfHour(minTime);

      while (isBefore(nextTick, maxTime)) {
        ticks.push(nextTick);
        nextTick = addHours(nextTick, 1);
      }
    } else {
      let nextTick = roundToNearestMinutes(minTime, {
        nearestTo: interval,
        roundingMethod: 'ceil',
      });

      while (isBefore(nextTick, maxTime)) {
        ticks.push(nextTick);
        nextTick = roundToNearestMinutes(addMinutes(nextTick, 1), {
          nearestTo: interval,
          roundingMethod: 'ceil',
        });
      }
    }

    return ticks;
  };

  const getMousePositionXPercent = (evt: MouseEvent) => {
    return (
      ((evt.clientX - (evt.target as HTMLDivElement).offsetLeft) /
        (evt.target as HTMLDivElement).offsetWidth) *
      100
    );
  };

  const handleMouseDown = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);
    onMouseDown(posX);
  };

  const handleMouseMove = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);

    if (posX < 0 || posX > 100) {
      // Ignore impossible values
      return;
    }
    onMouseMove(posX);
  };

  const handleMouseUp = (evt: MouseEvent) => {
    const posX = getMousePositionXPercent(evt);
    console.log('mouse up ', posX);
    onMouseUp(posX);
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

  const hourTicks = getTicks(minTime, maxTime, 60);
  const quarterTicks = getTicks(minTime, maxTime, 15);
  return (
    <div
      className="c-timeline"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="c-timeline__title">{timelineInfo.title}</div>
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
          const width =
            (differenceInMilliseconds(parseISO(event.endedAt), parseISO(event.startedAt)) /
              windowInMilliseconds) *
              100 +
            '%';

          const eventInfo = event.info as Record<string, string | number | boolean>;
          return (
            <Tippy
              key={'c-timeline__' + timelineInfo.title + '__event__tippy__' + event.startedAt}
              visible={!!selectedEvent?.id && selectedEvent.id === event.id}
              interactive
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
                  (selectedEvent?.id === event.id ? ' c-timeline__event--selected' : '')
                }
                key={'c-timeline__' + timelineInfo.title + '__event__div__' + event.startedAt}
                style={{
                  left:
                    (differenceInMilliseconds(parseISO(event.startedAt), minTime) /
                      windowInMilliseconds) *
                      100 +
                    '%',
                  width,
                  backgroundColor: getColorForEvent(timelineInfo, event),
                }}
                onClick={() => {
                  setSelectedEvent(event, timelineInfo);
                }}
              ></div>
            </Tippy>
          );
        })}

        {/* Selection */}
        {selectionPercentages && (
          <Tippy
            key={'c-timeline__' + timelineInfo.title + '__selection__tippy'}
            className="c-timeline__selection__tooltip--ended"
            interactive
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
          </Tippy>
        )}
      </div>
    </div>
  );
}

export default Timeline;
