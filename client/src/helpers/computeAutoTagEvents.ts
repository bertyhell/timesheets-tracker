import { type TimelineEvent, TimelineType } from '../components/Timeline/Timeline.types';
import { type Activity, BooleanOperator, ConditionVariable } from '../../../types/types';
import {
  type AutoTag,
  type AutoTagCondition,
  ConditionOperator,
  type Website,
} from '../types/types';
import { compact } from 'lodash-es';
import { v4 as uuid } from 'uuid';

const COMBINE_TAGS_THRESHOLD = 5 * 60 * 1000;

function splitConditionsOnOrOperators(conditions: AutoTagCondition[]): AutoTagCondition[][] {
  const groupedConditions: AutoTagCondition[][] = [];
  let currentGroup: AutoTagCondition[] = [];

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

function doesConditionMatchActivity(
  activity: Activity | Website,
  condition: AutoTagCondition
): boolean {
  if (!condition.variable) {
    return false;
  }

  if (condition.variable === ConditionVariable.anyVariable) {
    // Check all variables except for the anyVariable
    return !!Object.values(ConditionVariable)
      .filter((conditionVariable) => conditionVariable !== ConditionVariable.anyVariable)
      .find((conditionVariable) => {
        return doesConditionValueMatchActivity(activity, condition, conditionVariable);
      });
  } else {
    // Check one variable
    return doesConditionValueMatchActivity(activity, condition, condition.variable);
  }
}

function doesConditionValueMatchActivity(
  activity: Activity | Website,
  condition: AutoTagCondition,
  variable: ConditionVariable
): boolean {
  const toCheckValue: string = (activity as any)[variable];
  if (!toCheckValue) {
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

function doesAutoTagMatch(autoTag: AutoTag, activity: Activity): boolean {
  const groupedConditions = splitConditionsOnOrOperators(autoTag.conditions);
  const matchedGroup = groupedConditions.find((groupedCondition) => {
    return groupedCondition.every((condition) => doesConditionMatchActivity(activity, condition));
  });
  return !!matchedGroup;
}

export function calculateAutoTagEvents(
  programEvents: Activity[],
  autoTags: AutoTag[]
): TimelineEvent[] {
  const validAutoTags = autoTags.filter(
    (autoTag) => !!autoTag.tagName && autoTag.conditions?.length
  );
  const autoTagEvents = compact(
    programEvents.map((activity): TimelineEvent | null => {
      const autoTag = validAutoTags.find((autoTag) => doesAutoTagMatch(autoTag, activity));
      if (autoTag) {
        return {
          type: TimelineType.AutoTag,
          startedAt: new Date(activity.startedAt),
          endedAt: new Date(activity.endedAt),
          color: autoTag.tagName?.color || '',
          info: { tag: autoTag.tagName?.name || '', autoTagRule: autoTag.name },
          id: uuid(),
        };
      } else {
        return null;
      }
    })
  );

  const combinedAutoTagEvents = compact([compact(autoTagEvents)[0]]);
  if (autoTagEvents.length >= 2) {
    // Combine auto tags that evaluate to the same tag name
    let index = 1;
    do {
      const lastCombinedAutoTagEvent = combinedAutoTagEvents.at(-1) as TimelineEvent;
      const currentAutoTagEvent = autoTagEvents[index];
      if (
        lastCombinedAutoTagEvent.info.tag === currentAutoTagEvent.info.tag &&
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
