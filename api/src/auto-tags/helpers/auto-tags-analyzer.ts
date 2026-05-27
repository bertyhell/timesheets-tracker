import { BooleanOperator, ConditionOperator, ConditionVariable } from '../../types/types';
import { AutoTagConditionDto, AutoTagDto } from '../dto/response-auto-tag.dto';
import {
  AutoTagEventInfoDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../timelines/dto/response-timeline-events.dto';
import { compact, uniq } from 'lodash';
import { isAfter, isBefore, parseISO } from 'date-fns';
import { TagNameDto } from '../../tag-names/dto/response-tag-name.dto';
import { CustomError } from '../../shared/CustomError';
import { isNil } from 'es-toolkit';

const COMBINE_TAGS_THRESHOLD = 5 * 60 * 1000;
const DEFAULT_MAX_GROW_TIME_MINUTES = 5;

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
  const toCheckValue: string = String(event.info[variable]);
  if (isNil(toCheckValue)) {
    return false;
  }
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
      return new RegExp(condition.value, 'g').test(toCheckValue);
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

function getEventsAtTimestamp(timelinesWithEvents: TimelineWithEventsDto[], timestamp: Date) {
  return compact(
    timelinesWithEvents.map((timeline) => {
      return timeline.events.find((event) => {
        return (
          isAfter(timestamp, parseISO(event.startedAt)) &&
          isBefore(timestamp, parseISO(event.endedAt))
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

export function calculateAutoTagEvents(
  timelinesWithEvents: TimelineWithEventsDto[],
  autoTags: AutoTagDto[],
  autoTagTimeline: TimelineWithEventsDto,
  allTagNames: TagNameDto[],
  maxGrowTimeMinutes = DEFAULT_MAX_GROW_TIME_MINUTES
): TimelineEventDto[] {
  const validAutoTags = autoTags.filter(
    (autoTag) => !!autoTag.tagName && autoTag.conditions?.length
  );
  const allEventStartTimes = getAllEventStartTimes(timelinesWithEvents);
  const autoTagEvents: TimelineEventDto[] = [];
  allEventStartTimes.map((startTime) => {
    const eventsAtTimestamp = getEventsAtTimestamp(timelinesWithEvents, parseISO(startTime));
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
    return [];
  }

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

  return growAutoTagEvents(combinedAutoTagEvents, maxGrowTimeMinutes);
}
