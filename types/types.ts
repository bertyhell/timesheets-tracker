import type { AutoTagConditionDto } from '../client/src/generated/api/types.gen';
import { TimelineType } from '../client/src/components/Timeline/Timeline.types';

export interface Program {
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
  note?: string | null;
  tagName?: TagName;
}

export interface TagName {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface AutoNote {
  id: string;
  name: string;
  tagNameIds: string[];
  variable: ConditionVariable;
  extractRegex: string;
  extractRegexReplacement: string;
}

export interface AutoTag {
  id: string;
  name: string;
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
  isActive = 'isActive',
  programName = 'programName',
  windowTitle = 'windowTitle',
  summary = 'summary',
  description = 'description',
  location = 'location',
  allDay = 'allDay',
  websiteUrl = 'websiteUrl',
  websiteTitle = 'websiteTitle',
  tagNameId = 'tagNameId',
  tagNameName = 'tagNameName',
  tagNameColor = 'tagNameColor',
  tagNameCode = 'tagNameCode',
}

export enum ConditionOperator {
  contains = 'contains',
  doesNotContains = 'doesNotContains',
  isExact = 'isExact',
  isNotExact = 'isNotExact',
  matchesRegex = 'matchesRegex',
  doesNotMatchRegex = 'doesNotMatchRegex',
}

export interface TimelineEvent {
  id?: string;
  info: Record<string, string>;
  color: string;
  startedAt: Date;
  endedAt: Date;
  type: TimelineType;
}
