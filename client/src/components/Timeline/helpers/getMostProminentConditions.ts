import type { TimelineDto, TimelineEventDto } from '../../../generated/api/types.gen';
import { TimelineType } from '../Timeline.types';
import { ConditionVariable } from '../../../types/types';

export interface ProminentCondition {
  variable: ConditionVariable;
  value: string;
}

function addIfPresent(
  conditions: ProminentCondition[],
  variable: ConditionVariable,
  value: string | number | boolean | undefined
): void {
  if (value) {
    conditions.push({ variable, value: String(value) });
  }
}

export function getMostProminentConditions(
  timelineInfo: TimelineDto,
  event: TimelineEventDto
): ProminentCondition[] {
  const info = event.info as Record<string, string | number | boolean>;
  const conditions: ProminentCondition[] = [];
  switch (timelineInfo.timelineType) {
    case TimelineType.Program:
      addIfPresent(conditions, ConditionVariable.programName, info['programName']);
      addIfPresent(conditions, ConditionVariable.windowTitle, info['windowTitle']);
      break;
    case TimelineType.Website:
      addIfPresent(conditions, ConditionVariable.websiteTitle, info['websiteTitle']);
      addIfPresent(conditions, ConditionVariable.websiteUrl, info['websiteUrl']);
      break;
    case TimelineType.Calendar:
      addIfPresent(conditions, ConditionVariable.summary, info['summary']);
      addIfPresent(conditions, ConditionVariable.location, info['location']);
      addIfPresent(conditions, ConditionVariable.description, info['description']);
      break;
    case TimelineType.GitCommit:
      addIfPresent(conditions, ConditionVariable.repoName, info['repoName']);
      addIfPresent(conditions, ConditionVariable.commitMessage, info['commitMessage']);
      break;
    default:
      break;
  }
  return conditions;
}
