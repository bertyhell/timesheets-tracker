import {
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
  TimelineType,
} from '../../types/types';
import { AutoTagConditionDto, AutoTagDto } from '../dto/response-auto-tag.dto';
import {
  AutoTagEventInfoDto,
  MatchedAutoTagConditionDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../timelines/dto/response-timeline-events.dto';
import { compact, uniq, uniqBy } from 'lodash';
import { endOfDay, isAfter, isBefore, isEqual, isValid, parseISO, startOfDay } from 'date-fns';
import { TagNameDto } from '../../tag-names/dto/response-tag-name.dto';
import { CustomError } from '../../shared/CustomError';
import { isNil } from 'es-toolkit';
import { DEFAULT_AUTO_MERGE_TAGS_MINUTES } from '../../settings/dto/auto-merge-tags.dto';

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

/**
 * Checks a single condition against an event.
 * Returns the matched condition (including the event variable and value that triggered it)
 * or null when the condition does not match.
 */
function getMatchedCondition(
  event: TimelineEventDto,
  condition: AutoTagConditionDto
): MatchedAutoTagConditionDto | null {
  if (!condition.variable) {
    return null;
  }

  const variablesToCheck =
    condition.variable === ConditionVariable.anyVariable
      ? // Check all variable prop names except for the anyVariable prop name that exist in the enum ConditionVariable
        Object.values(ConditionVariable).filter(
          (conditionVariable) => conditionVariable !== ConditionVariable.anyVariable
        )
      : [condition.variable];

  const matchedVariable = variablesToCheck.find((conditionVariable) =>
    doesConditionValueMatchEvent(event, condition, conditionVariable)
  );
  if (!matchedVariable) {
    return null;
  }

  return {
    variable: matchedVariable,
    operator: condition.operator,
    value: condition.value,
    matchedValue: String(event.info[matchedVariable] ?? ''),
  };
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
    // The `g` flag is deliberately absent: it makes `.test()` stateful via lastIndex, which would
    // make a rule match or not depending on how many events came before it.
    case ConditionOperator.matchesRegex:
      return new RegExp(condition.value).test(toCheckValue);
    case ConditionOperator.doesNotMatchRegex:
      return !new RegExp(condition.value).test(toCheckValue);
    default:
      return false;
  }
}

/**
 * Checks an auto tag against an event.
 * Returns the conditions of the first matching AND-group, so the UI can show why the auto tag triggered.
 * Returns null when the auto tag does not match the event.
 */
function getMatchedAutoTagConditions(
  autoTag: AutoTagDto,
  event: TimelineEventDto
): MatchedAutoTagConditionDto[] | null {
  const groupedConditions = splitConditionsOnOrOperators(autoTag.conditions);
  for (const groupedCondition of groupedConditions) {
    const matchedConditions = groupedCondition.map((condition) =>
      getMatchedCondition(event, condition)
    );
    if (matchedConditions.every((matchedCondition) => !!matchedCondition)) {
      return matchedConditions as MatchedAutoTagConditionDto[];
    }
  }
  return null;
}

/**
 * An auto tag can be limited to an active period, so a rule for a project that ran from March
 * to June stops claiming time outside those months instead of having to be deleted.
 *
 * Both bounds are optional yyyy-MM-dd days in local time and both are inclusive: an auto tag
 * with activeUntil 2026-03-31 still matches an event that starts at 23:00 on 31 March. The
 * event's start is what is compared, so an event straddling a bound belongs to the day it
 * started on rather than being split.
 */
function isAutoTagActiveForEvent(autoTag: AutoTagDto, event: TimelineEventDto): boolean {
  if (!autoTag.activeFrom && !autoTag.activeUntil) {
    return true;
  }

  const eventStartedAt = parseISO(event.startedAt);

  if (autoTag.activeFrom) {
    const activeFrom = parseISO(autoTag.activeFrom);
    if (isValid(activeFrom) && isBefore(eventStartedAt, startOfDay(activeFrom))) {
      return false;
    }
  }

  if (autoTag.activeUntil) {
    const activeUntil = parseISO(autoTag.activeUntil);
    if (isValid(activeUntil) && isAfter(eventStartedAt, endOfDay(activeUntil))) {
      return false;
    }
  }

  return true;
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

    // Only grow into small gaps to bridge them with a neighbouring auto-tag event.
    // Isolated events keep their original (already accurate) bounds.
    let newStartTime = originalEventTime.startTime;
    const previousEventTime = originalEventTimes[index - 1];
    if (previousEventTime) {
      const gapToPreviousEvent = originalEventTime.startTime - previousEventTime.endTime;
      if (gapToPreviousEvent >= 0 && gapToPreviousEvent < 2 * maxGrowTimeMs) {
        newStartTime = previousEventTime.endTime + gapToPreviousEvent / 2;
      }
    }

    let newEndTime = originalEventTime.endTime;
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

/**
 * Unions the matched conditions of merged auto-tag events, deduplicating on the rule itself
 * (variable + operator + value) so the first matched value is kept.
 */
function mergeMatchedConditions(
  ...conditionLists: (MatchedAutoTagConditionDto[] | undefined)[]
): MatchedAutoTagConditionDto[] {
  return uniqBy(
    conditionLists.flatMap((conditions) => conditions ?? []),
    (condition) => `${condition.variable}|${condition.operator}|${condition.value}`
  );
}

function combineAutoTagEvents(
  autoTagEvents: TimelineEventDto[],
  combineGapMinutes: number
): TimelineEventDto[] {
  const safeCombineGapMinutes = Number.isFinite(combineGapMinutes) ? combineGapMinutes : 0;
  const combineGapMs = Math.max(0, safeCombineGapMinutes) * 60 * 1000;

  // The matching phase iterates start times per timeline, so the events are not globally sorted yet.
  const sortedAutoTagEvents = [...autoTagEvents].sort((a, b) => {
    return parseISO(a.startedAt).getTime() - parseISO(b.startedAt).getTime();
  });

  const combinedAutoTagEvents = [sortedAutoTagEvents[0]]; // Start with first event
  if (sortedAutoTagEvents.length >= 2) {
    // Combine auto tags that evaluate to the same tag name
    let index = 1;
    do {
      const lastCombinedAutoTagEvent = combinedAutoTagEvents.at(-1) as TimelineEventDto;
      const lastCombinedInfo = lastCombinedAutoTagEvent.info as AutoTagEventInfoDto;
      const currentAutoTagEvent = sortedAutoTagEvents[index];
      const currentInfo = currentAutoTagEvent.info as AutoTagEventInfoDto;
      if (
        lastCombinedInfo.tagNameId === currentInfo.tagNameId &&
        new Date(currentAutoTagEvent.startedAt).getTime() -
          new Date(lastCombinedAutoTagEvent.endedAt).getTime() <
          combineGapMs
      ) {
        // Combine events, keeping the union of the conditions that explain the merged block
        combinedAutoTagEvents[combinedAutoTagEvents.length - 1] = {
          ...lastCombinedAutoTagEvent,
          endedAt: currentAutoTagEvent.endedAt,
          info: {
            ...lastCombinedInfo,
            matchedConditions: mergeMatchedConditions(
              lastCombinedInfo.matchedConditions,
              currentInfo.matchedConditions
            ),
          },
        };
      } else {
        // Do not combine events
        combinedAutoTagEvents.push(currentAutoTagEvent);
      }
      index++;
    } while (index < sortedAutoTagEvents.length);
  }
  return combinedAutoTagEvents;
}

export function calculateAutoTagEvents(
  timelinesWithEvents: TimelineWithEventsDto[],
  autoTags: AutoTagDto[],
  autoTagTimeline: TimelineWithEventsDto,
  allTagNames: TagNameDto[],
  maxGrowTimeMinutes = DEFAULT_MAX_GROW_TIME_MINUTES,
  combineGapMinutes = DEFAULT_AUTO_MERGE_TAGS_MINUTES
): TimelineEventDto[] {
  const validAutoTags = autoTags.filter(
    (autoTag) => !!autoTag.tagName && autoTag.conditions?.length
  );
  const allEventStartTimes = getAllEventStartTimes(timelinesWithEvents);
  const autoTagEvents: TimelineEventDto[] = [];
  allEventStartTimes.map((startTime) => {
    const eventsAtTimestamp = getEventsAtTimestamp(timelinesWithEvents, startTime);
    eventsAtTimestamp.find((event) => {
      let matchedConditions: MatchedAutoTagConditionDto[] | null = null;
      const autoTag = validAutoTags.find((autoTag) => {
        if (!isAutoTagActiveForEvent(autoTag, event)) {
          matchedConditions = null;
          return false;
        }
        matchedConditions = getMatchedAutoTagConditions(autoTag, event);
        return !!matchedConditions;
      });
      if (!autoTag || !matchedConditions) {
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
        tagNameNote: tagName.note || undefined,
        tagNameCanGrow: !!tagName.canGrow,
        priority: autoTag.priority,
        matchedConditions,
      };
      autoTagEvents.push({
        id: crypto.randomUUID(),
        startedAt: event.startedAt,
        endedAt: event.endedAt,
        timelineId: autoTagTimeline.id,
        info: autoTagEventInfo,
      });
      return true;
    });
  });

  if (!autoTagEvents.length) {
    return [];
  }

  const combinedAutoTagEvents = combineAutoTagEvents(autoTagEvents, combineGapMinutes);

  return growAutoTagEvents(combinedAutoTagEvents, maxGrowTimeMinutes);
}
