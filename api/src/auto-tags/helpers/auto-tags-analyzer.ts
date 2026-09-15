import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { isNil } from 'es-toolkit';
import { compact, uniq, uniqBy } from 'lodash';

import { DEFAULT_AUTO_MERGE_TAGS_MINUTES } from '../../settings/dto/auto-merge-tags.dto';
import { CustomError } from '../../shared/CustomError';
import { TagNameDto } from '../../tag-names/dto/response-tag-name.dto';
import {
  AutoTagEventInfoDto,
  MatchedAutoTagConditionDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../timelines/dto/response-timeline-events.dto';
import {
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
} from '../../types/types';
import { AutoTagConditionDto, AutoTagDto } from '../dto/response-auto-tag.dto';

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
/** All variable prop names except the `anyVariable` placeholder itself. */
const ALL_CONDITION_VARIABLES = Object.values(ConditionVariable).filter(
  (conditionVariable) => conditionVariable !== ConditionVariable.anyVariable
);

/**
 * A condition with everything that does not depend on the event hoisted out of the hot loop:
 * the lowercased comparison value and the compiled regex. Both used to be recomputed for every
 * event × variable combination, which dominated the auto-tag analysis on busy days.
 */
interface CompiledCondition {
  condition: AutoTagConditionDto;
  variablesToCheck: ConditionVariable[];
  lowerValue: string;
  regex: RegExp | null;
}

/** An auto tag with its OR-groups split and its conditions compiled, done once per analysis. */
interface CompiledAutoTag {
  autoTag: AutoTagDto;
  groupedConditions: CompiledCondition[][];
  /** Inclusive active window in epoch millis, ±Infinity when unbounded. */
  fromMs: number;
  untilMs: number;
}

function compileCondition(condition: AutoTagConditionDto): CompiledCondition {
  let regex: RegExp | null = null;
  if (
    condition.operator === ConditionOperator.matchesRegex ||
    condition.operator === ConditionOperator.doesNotMatchRegex
  ) {
    try {
      // The `g` flag is deliberately absent: it makes `.test()` stateful via lastIndex, which would
      // make a rule match or not depending on how many events came before it.
      regex = new RegExp(condition.value);
    } catch {
      // Kept null so the invalid pattern still throws where it used to: while evaluating an event.
      regex = null;
    }
  }
  return {
    condition,
    variablesToCheck:
      condition.variable === ConditionVariable.anyVariable
        ? ALL_CONDITION_VARIABLES
        : [condition.variable],
    lowerValue: condition.value.toLowerCase(),
    regex,
  };
}

function compileAutoTag(autoTag: AutoTagDto): CompiledAutoTag {
  return {
    autoTag,
    groupedConditions: splitConditionsOnOrOperators(autoTag.conditions).map((groupedCondition) =>
      groupedCondition.map(compileCondition)
    ),
    ...getActiveBounds(autoTag),
  };
}

function getMatchedCondition(
  event: TimelineEventDto,
  compiledCondition: CompiledCondition
): MatchedAutoTagConditionDto | null {
  const { condition } = compiledCondition;
  if (!condition.variable) {
    return null;
  }

  const matchedVariable = compiledCondition.variablesToCheck.find((conditionVariable) =>
    doesConditionValueMatchEvent(event, compiledCondition, conditionVariable)
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
  compiledCondition: CompiledCondition,
  variable: ConditionVariable
): boolean {
  const rawValue = event.info[variable];
  if (isNil(rawValue)) {
    return false;
  }
  const { condition, lowerValue, regex } = compiledCondition;
  const toCheckValue: string = String(rawValue);
  switch (condition.operator) {
    case ConditionOperator.contains:
      return toCheckValue.toLowerCase().includes(lowerValue);
    case ConditionOperator.doesNotContains:
      return !toCheckValue.toLowerCase().includes(lowerValue);
    case ConditionOperator.isExact:
      return toCheckValue.toLowerCase() === lowerValue;
    case ConditionOperator.isNotExact:
      return toCheckValue.toLowerCase() !== lowerValue;
    case ConditionOperator.matchesRegex:
      // A pattern that failed to compile rethrows here, the same place it used to throw.
      return (regex ?? new RegExp(condition.value)).test(toCheckValue);
    case ConditionOperator.doesNotMatchRegex:
      return !(regex ?? new RegExp(condition.value)).test(toCheckValue);
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
  compiledAutoTag: CompiledAutoTag,
  event: TimelineEventDto
): MatchedAutoTagConditionDto[] | null {
  for (const groupedCondition of compiledAutoTag.groupedConditions) {
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
/**
 * The active bounds resolved to epoch millis once per auto tag, instead of re-parsing the
 * yyyy-MM-dd strings for every event.
 */
function getActiveBounds(autoTag: AutoTagDto): {
  fromMs: number;
  untilMs: number;
} {
  let fromMs = -Infinity;
  let untilMs = Infinity;

  if (autoTag.activeFrom) {
    const activeFrom = parseISO(autoTag.activeFrom);
    if (isValid(activeFrom)) {
      fromMs = startOfDay(activeFrom).getTime();
    }
  }

  if (autoTag.activeUntil) {
    const activeUntil = parseISO(autoTag.activeUntil);
    if (isValid(activeUntil)) {
      untilMs = endOfDay(activeUntil).getTime();
    }
  }

  return { fromMs, untilMs };
}

function isAutoTagActiveForEvent(compiledAutoTag: CompiledAutoTag, event: IndexedEvent): boolean {
  return event.startMs >= compiledAutoTag.fromMs && event.startMs <= compiledAutoTag.untilMs;
}

/**
 * An event with its ISO timestamps resolved to epoch millis once. Re-parsing these inside the
 * per-timestamp scan was the single most expensive thing this module did: the scan is quadratic
 * in the number of events, so a busy day meant tens of millions of `parseISO` calls.
 */
interface IndexedEvent {
  event: TimelineEventDto;
  startedAt: string;
  endedAt: string;
  startMs: number;
  endMs: number;
}

/**
 * A timeline's events, plus whether they are ordered by start time. Providers hand us ordered
 * events, which lets the per-timestamp lookup binary search instead of scanning. Events may still
 * overlap, so the search widens by the timeline's longest event: any event containing a timestamp
 * must have started within that span before it. When a provider hands us unordered events we fall
 * back to the linear scan, so the result stays the event that comes first in the timeline's own
 * order either way.
 */
interface IndexedTimeline {
  events: IndexedEvent[];
  isSorted: boolean;
  maxDurationMs: number;
}

function indexTimelines(timelinesWithEvents: TimelineWithEventsDto[]): IndexedTimeline[] {
  return timelinesWithEvents.map((timeline) => {
    const events = timeline.events.map((event) => ({
      event,
      startedAt: event.startedAt,
      endedAt: event.endedAt,
      startMs: parseISO(event.startedAt).getTime(),
      endMs: parseISO(event.endedAt).getTime(),
    }));
    let isSorted = true;
    let maxDurationMs = 0;
    events.forEach((indexedEvent, index) => {
      if (index > 0 && events[index - 1].startMs > indexedEvent.startMs) {
        isSorted = false;
      }
      const duration = indexedEvent.endMs - indexedEvent.startMs;
      if (Number.isFinite(duration) && duration > maxDurationMs) {
        maxDurationMs = duration;
      }
    });
    return { events, isSorted, maxDurationMs };
  });
}

/**
 * Index of the last event whose start is at or before the timestamp, or -1. Only meaningful for a
 * timeline that is ordered and non-overlapping, where it is the only event that can contain it.
 */
function findLastStartedAtOrBefore(events: IndexedEvent[], timestampMs: number): number {
  let low = 0;
  let high = events.length - 1;
  let result = -1;
  while (low <= high) {
    const middle = (low + high) >>> 1;
    if (events[middle].startMs <= timestampMs) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return result;
}

function containsTimestamp(
  indexedEvent: IndexedEvent,
  timestamp: string,
  timestampMs: number
): boolean {
  return (
    (timestamp === indexedEvent.startedAt || timestampMs > indexedEvent.startMs) &&
    (timestamp === indexedEvent.endedAt || timestampMs < indexedEvent.endMs)
  );
}

function getEventsAtTimestamp(
  indexedTimelines: IndexedTimeline[],
  timestamp: string,
  timestampMs: number
): IndexedEvent[] {
  return compact(
    indexedTimelines.map(({ events, isSorted, maxDurationMs }) => {
      if (!isSorted) {
        return events.find((indexedEvent) =>
          containsTimestamp(indexedEvent, timestamp, timestampMs)
        );
      }
      // Events are ordered by start, so the array order the caller expects is also the index
      // order: walking backwards and keeping the last hit yields the lowest-index match.
      const index = findLastStartedAtOrBefore(events, timestampMs);
      const earliestRelevantStartMs = timestampMs - maxDurationMs;
      let match: IndexedEvent | undefined;
      for (let i = index; i >= 0 && events[i].startMs >= earliestRelevantStartMs; i--) {
        if (containsTimestamp(events[i], timestamp, timestampMs)) {
          match = events[i];
        }
      }
      // The event right after the window can still match on the `timestamp === startedAt` string
      // check, but only counts when nothing at a lower index did.
      if (!match && events[index + 1]) {
        const next = events[index + 1];
        if (containsTimestamp(next, timestamp, timestampMs)) {
          match = next;
        }
      }
      return match;
    })
  );
}

function getAllEventStartTimes(indexedTimelines: IndexedTimeline[]): string[] {
  return uniq(
    indexedTimelines.flatMap(({ events }) => {
      return events.map((indexedEvent) => indexedEvent.startedAt);
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
  const validAutoTags = autoTags
    .filter((autoTag) => !!autoTag.tagName && autoTag.conditions?.length)
    .map(compileAutoTag);
  const indexedTimelines = indexTimelines(timelinesWithEvents);
  const allEventStartTimes = getAllEventStartTimes(indexedTimelines);
  const tagNamesById = new Map(allTagNames.map((tagName) => [tagName.id, tagName]));
  const autoTagEvents: TimelineEventDto[] = [];
  allEventStartTimes.map((startTime) => {
    const startTimeMs = parseISO(startTime).getTime();
    const eventsAtTimestamp = getEventsAtTimestamp(indexedTimelines, startTime, startTimeMs);
    eventsAtTimestamp.find((indexedEvent) => {
      const event = indexedEvent.event;
      let matchedConditions: MatchedAutoTagConditionDto[] | null = null;
      const compiledAutoTag = validAutoTags.find((compiledAutoTag) => {
        if (!isAutoTagActiveForEvent(compiledAutoTag, indexedEvent)) {
          matchedConditions = null;
          return false;
        }
        matchedConditions = getMatchedAutoTagConditions(compiledAutoTag, event);
        return !!matchedConditions;
      });
      if (!compiledAutoTag || !matchedConditions) {
        return false;
      }
      const autoTag = compiledAutoTag.autoTag;
      // Found a match between event and auto tag
      // Produce an autoTagEvent
      const tagName = tagNamesById.get(autoTag.tagNameId);
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
