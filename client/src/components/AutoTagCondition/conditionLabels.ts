import type { GroupBase } from 'react-select';

import { ConditionOperator, ConditionVariable } from '../../types/types';
import type { SelectOption } from '../../helpers/select-option.types';

/**
 * Human readable names for the raw enum values. The enums are API contract, the labels are
 * what the user reads, so the two are deliberately kept apart.
 *
 * The variables are grouped by the timeline they come from: a rule almost always matches on
 * fields of one source, so grouping them makes the long flat list navigable.
 */
export const CONDITION_VARIABLE_GROUPS: GroupBase<SelectOption<ConditionVariable>>[] = [
  {
    label: 'Any',
    options: [{ value: ConditionVariable.anyVariable, label: 'Any field' }],
  },
  {
    label: 'Apps',
    options: [
      { value: ConditionVariable.programName, label: 'Program name' },
      { value: ConditionVariable.windowTitle, label: 'Window title' },
      { value: ConditionVariable.isActive, label: 'Is active' },
    ],
  },
  {
    label: 'Browser',
    options: [
      { value: ConditionVariable.websiteTitle, label: 'Website title' },
      { value: ConditionVariable.websiteUrl, label: 'Website URL' },
    ],
  },
  {
    label: 'Calendar',
    options: [
      { value: ConditionVariable.summary, label: 'Event summary' },
      { value: ConditionVariable.description, label: 'Description' },
      { value: ConditionVariable.location, label: 'Location' },
      { value: ConditionVariable.allDay, label: 'All-day event' },
    ],
  },
  {
    label: 'Tags',
    options: [
      { value: ConditionVariable.tagNameName, label: 'Tag name' },
      { value: ConditionVariable.tagNameCode, label: 'Tag code' },
      { value: ConditionVariable.tagNameId, label: 'Tag ID' },
      { value: ConditionVariable.tagNameColor, label: 'Tag color' },
    ],
  },
  {
    label: 'Git',
    options: [
      { value: ConditionVariable.repoName, label: 'Repository name' },
      { value: ConditionVariable.commitMessage, label: 'Commit message' },
    ],
  },
  {
    label: 'Jira',
    options: [
      { value: ConditionVariable.jiraIssueKey, label: 'Ticket key' },
      { value: ConditionVariable.jiraSummary, label: 'Ticket summary' },
      { value: ConditionVariable.jiraProjectKey, label: 'Project key' },
      { value: ConditionVariable.jiraProjectName, label: 'Project name' },
      { value: ConditionVariable.jiraIssueType, label: 'Issue type' },
      { value: ConditionVariable.jiraStatus, label: 'Status' },
      { value: ConditionVariable.jiraPriority, label: 'Priority' },
      { value: ConditionVariable.jiraSprint, label: 'Sprint' },
      { value: ConditionVariable.jiraLabels, label: 'Labels' },
      { value: ConditionVariable.jiraComponents, label: 'Components' },
      { value: ConditionVariable.jiraFixVersions, label: 'Fix versions' },
      { value: ConditionVariable.jiraAssignee, label: 'Assignee' },
      { value: ConditionVariable.jiraReporter, label: 'Reporter' },
      { value: ConditionVariable.jiraParentKey, label: 'Parent key' },
      { value: ConditionVariable.jiraParentSummary, label: 'Parent summary' },
    ],
  },
  {
    label: 'File edits',
    options: [
      // Repository name is deliberately absent here: it is the same variable the Git group already
      // offers, and one rule on it matches both commits and editing time.
      { value: ConditionVariable.filePath, label: 'File path' },
      { value: ConditionVariable.fileName, label: 'File name' },
      { value: ConditionVariable.fileExtension, label: 'File extension' },
    ],
  },
];

export const CONDITION_OPERATOR_OPTIONS: SelectOption<ConditionOperator>[] = [
  { value: ConditionOperator.contains, label: 'contains' },
  { value: ConditionOperator.doesNotContains, label: 'does not contain' },
  { value: ConditionOperator.isExact, label: 'is exactly' },
  { value: ConditionOperator.isNotExact, label: 'is not' },
  { value: ConditionOperator.matchesRegex, label: 'matches regex' },
  { value: ConditionOperator.doesNotMatchRegex, label: 'does not match regex' },
];

const VARIABLE_LABELS: Record<string, string> = Object.fromEntries(
  CONDITION_VARIABLE_GROUPS.flatMap((group) =>
    group.options.map((option) => [option.value, option.label])
  )
);

const OPERATOR_LABELS: Record<string, string> = Object.fromEntries(
  CONDITION_OPERATOR_OPTIONS.map((option) => [option.value, option.label])
);

/** Falls back to the raw enum value so an enum added on the API side is still readable. */
export function conditionVariableLabel(variable: ConditionVariable | null): string {
  if (!variable) return '';
  return VARIABLE_LABELS[variable] ?? variable;
}

export function conditionOperatorLabel(operator: ConditionOperator | null): string {
  if (!operator) return '';
  return OPERATOR_LABELS[operator] ?? operator;
}

export function isRegexOperator(operator: ConditionOperator | null): boolean {
  return (
    operator === ConditionOperator.matchesRegex || operator === ConditionOperator.doesNotMatchRegex
  );
}
