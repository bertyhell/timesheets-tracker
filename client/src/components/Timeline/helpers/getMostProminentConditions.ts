import type { TimelineDto, TimelineEventDto } from '../../../generated/api/types.gen';

import { ConditionVariable } from '../../../types/types';
import { TimelineType } from '../Timeline.types';

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

function getConditionsForEvent(
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
    case TimelineType.Jira:
      // Broadest first: most rules tag a whole project, and the narrower ones below are there to be
      // deleted down to whichever one the user actually wants to tag by.
      addIfPresent(conditions, ConditionVariable.jiraProjectKey, info['jiraProjectKey']);
      addIfPresent(conditions, ConditionVariable.jiraProjectName, info['jiraProjectName']);
      addIfPresent(conditions, ConditionVariable.jiraIssueKey, info['jiraIssueKey']);
      addIfPresent(conditions, ConditionVariable.jiraLabels, info['jiraLabels']);
      addIfPresent(conditions, ConditionVariable.jiraFixVersions, info['jiraFixVersions']);
      addIfPresent(conditions, ConditionVariable.jiraSprint, info['jiraSprint']);
      break;
    case TimelineType.FileEdit:
      // Broadest first, same as Jira: a rule almost always tags a whole repository, and the
      // narrower ones are offered so they can be deleted down to the one that is wanted.
      addIfPresent(conditions, ConditionVariable.repoName, info['repoName']);
      addIfPresent(conditions, ConditionVariable.filePath, info['filePath']);
      addIfPresent(conditions, ConditionVariable.fileName, info['fileName']);
      break;
    default:
      break;
  }
  return conditions;
}

/**
 * Conditions for one or more events, e.g. the events hidden behind a merged bar. The conditions of
 * a new rule are OR-ed together, so every unique value becomes its own row. Rows are grouped by
 * variable (all program names, then all window titles, ...) in the order the variables first
 * appear, and duplicates are dropped case-insensitively since matching ignores case.
 */
export function getMostProminentConditions(
  timelineInfo: TimelineDto,
  events: TimelineEventDto | TimelineEventDto[]
): ProminentCondition[] {
  const byVariable = new Map<ConditionVariable, ProminentCondition[]>();
  const seen = new Set<string>();
  for (const event of Array.isArray(events) ? events : [events]) {
    for (const condition of getConditionsForEvent(timelineInfo, event)) {
      const key = `${condition.variable}\u0000${condition.value.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const group = byVariable.get(condition.variable) ?? [];
      group.push(condition);
      byVariable.set(condition.variable, group);
    }
  }
  return [...byVariable.values()].flat();
}
