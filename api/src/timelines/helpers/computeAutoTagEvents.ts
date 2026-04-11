// import { TimelineType } from '../components/Timeline/Timeline.types';
// import { BooleanOperator, ConditionVariable } from '../../../types/types';
// import { ConditionOperator } from '../types/types';
// import { compact } from 'lodash-es';
// import { v4 as uuid } from 'uuid';
// import {
//   AutoTagConditionDto,
//   AutoTagDto,
//   AutoTagEventInfoDto,
//   ResponseProgramDto,
//   ResponseWebsiteDto,
//   TimelineEventDto,
// } from '../generated/api/requests';
//
// const COMBINE_TAGS_THRESHOLD = 5 * 60 * 1000;
//
// function splitConditionsOnOrOperators(conditions: AutoTagConditionDto[]): AutoTagConditionDto[][] {
//   const groupedConditions: AutoTagConditionDto[][] = [];
//   let currentGroup: AutoTagConditionDto[] = [];
//
//   let currentIndex = 0;
//   do {
//     const currentCondition = conditions[currentIndex];
//     currentGroup.push(currentCondition);
//     if (currentCondition.booleanOperator === BooleanOperator.OR) {
//       groupedConditions.push(currentGroup);
//       currentGroup = [];
//     }
//     currentIndex++;
//   } while (currentIndex < conditions.length);
//
//   return groupedConditions;
// }
//
// function doesConditionMatchProgram(
//   activity: ResponseProgramDto | ResponseWebsiteDto,
//   condition: AutoTagConditionDto
// ): boolean {
//   if (!condition.variable) {
//     return false;
//   }
//
//   if (condition.variable === 'anyVariable') {
//     // Check all variables except for the anyVariable
//     return !!Object.values(ConditionVariable)
//       .filter((conditionVariable) => conditionVariable !== ConditionVariable.anyVariable)
//       .find((conditionVariable) => {
//         return doesConditionValueMatchProgram(activity, condition, conditionVariable);
//       });
//   } else {
//     // Check one variable
//     return doesConditionValueMatchProgram(
//       activity,
//       condition,
//       condition.variable as ConditionVariable
//     );
//   }
// }
//
// function doesConditionValueMatchProgram(
//   activity: ResponseProgramDto | ResponseWebsiteDto,
//   condition: AutoTagConditionDto,
//   variable: ConditionVariable
// ): boolean {
//   const toCheckValue: string = (activity as any)[variable];
//   if (!toCheckValue) {
//     return false;
//   }
//   switch (condition.operator) {
//     case ConditionOperator.contains:
//       return toCheckValue.toLowerCase().includes(condition.value.toLowerCase());
//     case ConditionOperator.doesNotContains:
//       return !toCheckValue.toLowerCase().includes(condition.value.toLowerCase());
//     case ConditionOperator.isExact:
//       return toCheckValue.toLowerCase() === condition.value.toLowerCase();
//     case ConditionOperator.isNotExact:
//       return toCheckValue.toLowerCase() !== condition.value.toLowerCase();
//     case ConditionOperator.doesNotMatchRegex:
//       return new RegExp(condition.value, 'g').test(toCheckValue);
//     default:
//       return false;
//   }
// }
//
// function doesAutoTagMatch(autoTag: AutoTagDto, activity: ResponseProgramDto): boolean {
//   const groupedConditions = splitConditionsOnOrOperators(autoTag.conditions);
//   const matchedGroup = groupedConditions.find((groupedCondition) => {
//     return groupedCondition.every((condition) => doesConditionMatchProgram(activity, condition));
//   });
//   return !!matchedGroup;
// }
//
// export function calculateAutoTagEvents(
//   programEvents: ResponseProgramDto[],
//   autoTags: AutoTagDto[]
// ): TimelineEventDto[] {
//   const validAutoTags = autoTags.filter(
//     (autoTag) => !!autoTag.tagName && autoTag.conditions?.length
//   );
//   const autoTagEvents = compact(
//     programEvents.map((activity): TimelineEventDto | null => {
//       const autoTag = validAutoTags.find((autoTag) => doesAutoTagMatch(autoTag, activity));
//       if (autoTag) {
//         return {
//           type: TimelineType.AutoTag,
//           startedAt: activity.startedAt,
//           endedAt: activity.endedAt,
//           color: autoTag.tagName?.color || '',
//           info: { tagNameName: autoTag.tagName?.title || '' } as any,
//           id: uuid(),
//         };
//       } else {
//         return null;
//       }
//     })
//   );
//
//   const combinedAutoTagEvents = compact([compact(autoTagEvents)[0]]);
//   if (autoTagEvents.length >= 2) {
//     // Combine auto tags that evaluate to the same tag name
//     let index = 1;
//     do {
//       const lastCombinedAutoTagEvent = combinedAutoTagEvents.at(-1) as TimelineEventDto;
//       const currentAutoTagEvent = autoTagEvents[index];
//       if (
//         (lastCombinedAutoTagEvent.info as AutoTagEventInfoDto).tagNameId ===
//           (currentAutoTagEvent.info as AutoTagEventInfoDto).tagNameId &&
//         new Date(currentAutoTagEvent.startedAt).getTime() -
//           new Date(lastCombinedAutoTagEvent.endedAt).getTime() <
//           COMBINE_TAGS_THRESHOLD
//       ) {
//         // Combine events
//         lastCombinedAutoTagEvent.endedAt = currentAutoTagEvent.endedAt;
//       } else {
//         // Do not combine events
//         combinedAutoTagEvents.push(currentAutoTagEvent);
//       }
//       index++;
//     } while (index < autoTagEvents.length);
//   }
//
//   return combinedAutoTagEvents;
// }
