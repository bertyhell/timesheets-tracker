import { BooleanOperator, ConditionOperator, ConditionVariable, TimelineType } from '../../types/types';
import { AutoTagConditionDto, AutoTagDto } from '../dto/response-auto-tag.dto';
import {
  AutoTagEventInfoDto,
  TagEventInfoDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../timelines/dto/response-timeline-events.dto';
import { compact, uniq } from 'lodash';
import { isAfter, isBefore, isEqual, parseISO } from 'date-fns';
import { TagNameDto } from '../../tag-names/dto/response-tag-name.dto';
import { CustomError } from '../../shared/CustomError';
import { isNil } from 'es-toolkit';

const COMBINE_TAGS_THRESHOLD = 5 * 60 * 1000;
const DEFAULT_MAX_GROW_TIME_MINUTES = 5;

/**
 * Takes a list of conditions and splits them based on the OR operators
 * Returns an array of arrays with all conditions inside a single array having the AND operator or being singular conditions
 * @param conditions
 */
function splitConditionsOnOrOperators(conditions: AutoTagConditionDto[]): AutoTagConditionDto[][] {
  const groupedConditions: AutoTagConditionDto[][] = [];
  let currentGroup: AutoTagConditionDto[] = [];

  let currentIndex = 0;
  do {
    const currentCondition = conditions[currentIndex];
    currentGroup.push(currentCondition);
    if (currentCondition.booleanOperator === BooleanOperator.OR) {
      groupedConditions.push(currentGroup);
      currentGroup = [];
    }
    currentIndex++;
  } while (currentIndex < conditions.length);

  if (currentGroup.length > 0) {
    groupedConditions.push(currentGroup);
  }
  return groupedConditions;
}

function doesConditionMatchEvent(event: TimelineEventDto, condition: AutoTagConditionDto): boolean {
  if (!condition.variable) {
    return false;
  }

  if (condition.variable === 'anyVariable') {
    // Check all variables prop names except for the anyVariable prop name that exist in the enum ConditionVariable
    return !!Object.values(ConditionVariable)
      .filter((conditionVariable) => conditionVariable !== ConditionVariable.anyVariable)
      .find((conditionVariable) => {
        return doesConditionValueMatchEvent(event, condition, conditionVariable);
      });
  } else {
    // Check one variable
    return doesConditionValueMatchEvent(event, condition, condition.variable);
  }
}

function doesConditionValueMatchEvent(
  event: TimelineEventDto,
  condition: AutoTagConditionDto,
  variable: ConditionVariable
): boolean {
  const rawValue = event.info[variable];
  if (isNil(rawValue)) {
    return false;
  }
  const toCheckValue: string = String(rawValue);
  switch (condition.operator) {
    case ConditionOperator.contains:
      return toCheckValue.toLowerCase().includes(condition.value.toLowerCase());
    case ConditionOperator.doesNotContains:
      return !toCheckValue.toLowerCase().includes(condition.value.toLowerCase());
    case ConditionOperator.isExact:
      return toCheckValue.toLowerCase() === condition.value.toLowerCase();
    case ConditionOperator.isNotExact:
      return toCheckValue.toLowerCase() !== condition.value.toLowerCase();
    case ConditionOperator.doesNotMatchRegex:
      return !new RegExp(condition.value, 'g').test(toCheckValue);
    default:
      return false;
  }
}

function doesAutoTagMatch(autoTag: AutoTagDto, event: TimelineEventDto): boolean {
  const groupedConditions = splitConditionsOnOrOperators(autoTag.conditions);
  const matchedGroup = groupedConditions.find((groupedCondition) => {
    return groupedCondition.every((condition) => doesConditionMatchEvent(event, condition));
  });
  return !!matchedGroup;
}

function getEventsAtTimestamp(timelinesWithEvents: TimelineWithEventsDto[], timestamp: string) {
  const currentTimestamp = parseISO(timestamp);
  return compact(
    timelinesWithEvents.map((timeline) => {
      return timeline.events.find((event) => {
        return (
          (timestamp === event.startedAt || isAfter(currentTimestamp, parseISO(event.startedAt))) &&
          (timestamp === event.endedAt || isBefore(currentTimestamp, parseISO(event.endedAt)))
        );
      });
    })
  );
}

function getAllEventStartTimes(timelinesWithEvents: TimelineWithEventsDto[]): string[] {
  return uniq(
    timelinesWithEvents.flatMap((timeline) => {
      return timeline.events.map((event) => event.startedAt);
    })
  );
}

export function growAutoTagEvents(
  autoTagEvents: TimelineEventDto[],
  maxGrowTimeMinutes: number
): TimelineEventDto[] {
  if (!autoTagEvents.length) {
    return [];
  }

  const safeMaxGrowTimeMinutes = Number.isFinite(maxGrowTimeMinutes) ? maxGrowTimeMinutes : 0;
  const maxGrowTimeMs = Math.max(0, safeMaxGrowTimeMinutes) * 60 * 1000;
  const sortedAutoTagEvents = [...autoTagEvents].sort((a, b) => {
    return parseISO(a.startedAt).getTime() - parseISO(b.startedAt).getTime();
  });
  const originalEventTimes = sortedAutoTagEvents.map((event) => ({
    startTime: parseISO(event.startedAt).getTime(),
    endTime: parseISO(event.endedAt).getTime(),
  }));

  sortedAutoTagEvents.forEach((event, index) => {
    const originalEventTime = originalEventTimes[index];

    let newStartTime = originalEventTime.startTime - maxGrowTimeMs;
    const previousEventTime = originalEventTimes[index - 1];
    if (previousEventTime) {
      const gapToPreviousEvent = originalEventTime.startTime - previousEventTime.endTime;
      if (gapToPreviousEvent >= 0 && gapToPreviousEvent < 2 * maxGrowTimeMs) {
        newStartTime = previousEventTime.endTime + gapToPreviousEvent / 2;
      }
    }

    let newEndTime = originalEventTime.endTime + maxGrowTimeMs;
    const nextEventTime = originalEventTimes[index + 1];
    if (nextEventTime) {
      const gapToNextEvent = nextEventTime.startTime - originalEventTime.endTime;
      if (gapToNextEvent >= 0 && gapToNextEvent < 2 * maxGrowTimeMs) {
        newEndTime = originalEventTime.endTime + gapToNextEvent / 2;
      }
    }

    event.startedAt = new Date(newStartTime).toISOString();
    event.endedAt = new Date(newEndTime).toISOString();
  });

  return sortedAutoTagEvents;
}

function combineAutoTagEvents(autoTagEvents: TimelineEventDto[]): TimelineEventDto[] {
  const combinedAutoTagEvents = [autoTagEvents[0]]; // Start with first event
  if (autoTagEvents.length >= 2) {
    // Combine auto tags that evaluate to the same tag name
    let index = 1;
    do {
      const lastCombinedAutoTagEvent = combinedAutoTagEvents.at(-1) as TimelineEventDto;
      const currentAutoTagEvent = autoTagEvents[index];
      if (
        (lastCombinedAutoTagEvent.info as AutoTagEventInfoDto).tagNameId ===
          (currentAutoTagEvent.info as AutoTagEventInfoDto).tagNameId &&
        new Date(currentAutoTagEvent.startedAt).getTime() -
          new Date(lastCombinedAutoTagEvent.endedAt).getTime() <
          COMBINE_TAGS_THRESHOLD
      ) {
        // Combine events
        lastCombinedAutoTagEvent.endedAt = currentAutoTagEvent.endedAt;
      } else {
        // Do not combine events
        combinedAutoTagEvents.push(currentAutoTagEvent);
      }
      index++;
    } while (index < autoTagEvents.length);
  }
  return combinedAutoTagEvents;
}

/**
 * Converts manual tag events into the AutoTagEventInfoDto shape so they can
 * be included in an auto-tag timeline, preserving their original time ranges.
 */
function convertTagEventsToAutoTagEvents(
  tagTimelines: TimelineWithEventsDto[],
  autoTagTimelineId: string
): TimelineEventDto[] {
  return tagTimelines.flatMap((timeline) =>
    timeline.events.map((tagEvent) => {
      const tagInfo = tagEvent.info as TagEventInfoDto;
      const autoTagEventInfo: AutoTagEventInfoDto = {
        autoTagId: '',
        tagNameId: tagInfo.tagNameId,
        tagNameTitle: tagInfo.tagNameName,
        tagNameColor: tagInfo.tagNameColor,
        tagNameCode: tagInfo.tagNameCode,
        priority: Infinity,
      };
      return {
        id: crypto.randomUUID(),
        startedAt: tagEvent.startedAt,
        endedAt: tagEvent.endedAt,
        timelineId: autoTagTimelineId,
        info: autoTagEventInfo,
      };
    })
  );
}


/**
 * Removes time ranges covered by manual tag events from auto-tag events.
 * manual tags always take precedence.
 */
export function clipAutoTagEventsAgainstTagEvents(
  autoTagEvents: TimelineEventDto[],
  tagTimelines: TimelineWithEventsDto[]
): TimelineEventDto[] {
  const tagEvents = tagTimelines.flatMap((t) => t.events);
  if (!tagEvents.length) {
    return autoTagEvents;
  }

  const result: TimelineEventDto[] = [];

  for (const autoTagEvent of autoTagEvents) {
    let segments: [number, number][] = [
      [parseISO(autoTagEvent.startedAt).getTime(), parseISO(autoTagEvent.endedAt).getTime()],
    ];

    for (const tagEvent of tagEvents) {
      const tagStart = parseISO(tagEvent.startedAt).getTime();
      const tagEnd = parseISO(tagEvent.endedAt).getTime();

      const newSegments: [number, number][] = [];
      for (const [segStart, segEnd] of segments) {
        if (tagEnd <= segStart || tagStart >= segEnd) {
          // No overlap — keep segment as-is
          newSegments.push([segStart, segEnd]);
        } else {
          // Overlap — cut out the tag period
          if (segStart < tagStart) {
            newSegments.push([segStart, tagStart]);
          }
          if (segEnd > tagEnd) {
            newSegments.push([tagEnd, segEnd]);
          }
        }
      }
      segments = newSegments;
    }

    for (const [segStart, segEnd] of segments) {
      if (segEnd > segStart) {
        result.push({
          ...autoTagEvent,
          id: crypto.randomUUID(),
          startedAt: new Date(segStart).toISOString(),
          endedAt: new Date(segEnd).toISOString(),
        });
      }
    }
  }

  return result;
}

export function calculateAutoTagEvents(
  timelinesWithEvents: TimelineWithEventsDto[],
  autoTags: AutoTagDto[],
  autoTagTimeline: TimelineWithEventsDto,
  allTagNames: TagNameDto[],
  maxGrowTimeMinutes = DEFAULT_MAX_GROW_TIME_MINUTES,
  tagTimelines: TimelineWithEventsDto[] = []
): TimelineEventDto[] {
  const validAutoTags = autoTags.filter(
    (autoTag) => !!autoTag.tagName && autoTag.conditions?.length
  );
  const allEventStartTimes = getAllEventStartTimes(timelinesWithEvents);
  const autoTagEvents: TimelineEventDto[] = [];
  allEventStartTimes.map((startTime) => {
    const eventsAtTimestamp = getEventsAtTimestamp(timelinesWithEvents, startTime);
    eventsAtTimestamp.find((event) => {
      const autoTag = validAutoTags.find((autoTag) => doesAutoTagMatch(autoTag, event));
      if (!autoTag) {
        return false;
      }
      // Found a match between event and auto tag
      // Produce an autoTagEvent
      const tagName = allTagNames.find((tagName) => tagName.id === autoTag.tagNameId);
      if (!tagName) {
        console.error(
          new CustomError('Found autotag for which no tagname was found', null, { autoTag, event })
        );
        return false;
      }
      const autoTagEventInfo: AutoTagEventInfoDto = {
        autoTagId: autoTag.id,
        tagNameId: tagName.id,
        tagNameColor: tagName.color,
        tagNameTitle: tagName.title,
        tagNameCode: tagName.code,
        priority: autoTag.priority,
      };
      autoTagEvents.push({
        id: crypto.randomUUID(),
        startedAt: event.startedAt,
        endedAt: event.startedAt, // zero width events for now, we'll grow them once we know all the auto tag events
        timelineId: autoTagTimeline.id,
        info: autoTagEventInfo,
      });
      return true;
    });
  });

  if (!autoTagEvents.length) {
    return convertTagEventsToAutoTagEvents(tagTimelines, autoTagTimeline.id);
  }

  const combinedAutoTagEvents = combineAutoTagEvents(autoTagEvents);

  const grownAutoTagEvents = growAutoTagEvents(combinedAutoTagEvents, maxGrowTimeMinutes);

  const clippedAutoTagEvents = clipAutoTagEventsAgainstTagEvents(grownAutoTagEvents, tagTimelines);

  const manualTagsAsAutoTagEvents = convertTagEventsToAutoTagEvents(tagTimelines, autoTagTimeline.id);

  return [...clippedAutoTagEvents, ...manualTagsAsAutoTagEvents];
}
