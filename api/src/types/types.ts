export interface Activity {
  id: string;
  programName: string;
  windowTitle: string;
  startedAt: string;
  endedAt: string;
}

export interface Website {
  id: string;
  websiteTitle: string;
  websiteUrl: string;
  startedAt: string;
  endedAt?: string; // Automatically determined by the next change in activity
}

export interface ActiveState {
  id: string;
  isActive: boolean;
  startedAt: string;
  endedAt: string;
}

export interface Tag {
  id: string;
  tagNameId: string;
  startedAt: string;
  endedAt: string;
  tagName?: TagName;
}

export interface TagName {
  id: string;
  title: string;
  code: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  startedAt: string;
  endedAt: string;
  allDay: boolean;
}

export interface AutoNote {
  id: string;
  title: string;
  tagNameIds: string[];
  variable: ConditionVariable;
  extractRegex: string;
  extractRegexReplacement: string;
}

export interface AutoTag {
  id: string;
  title: string;
  tagNameId: string;
  priority: number;
  conditions: AutoTagCondition[];
  tagName?: TagName;
}

export interface AutoTagCondition {
  booleanOperator: BooleanOperator;
  variable: ConditionVariable | null;
  operator: ConditionOperator | null;
  value: string;
}

export enum BooleanOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum ConditionVariable {
  anyVariable = 'anyVariable',
  windowTitle = 'windowTitle',
  programName = 'programName',
  websiteTitle = 'websiteTitle',
  websiteUrl = 'websiteUrl',
}

export enum ConditionOperator {
  contains = 'contains',
  doesNotContains = 'doesNotContains',
  isExact = 'isExact',
  isNotExact = 'isNotExact',
  matchesRegex = 'matchesRegex',
  doesNotMatchRegex = 'doesNotMatchRegex',
}

export interface Calendar {
  id: string;
  title: string;
  url: string;
  color: string;
}
