import {
  CalendarEventProviderInfoDto,
  GitCommitEventProviderInfoDto,
} from '../timelines/dto/response-timeline.dto';

export interface Program {
  id: string;
  programName: string;
  windowTitle: string;
  startedAt: string;
  endedAt: string;
  iconColor?: string;
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
  title: string;
  code: string;
  color: string;
  note?: string | null;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  location: string;
  allDay: boolean;
  startedAt: string;
  endedAt: string;
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

// Keys from the info object in TimelineEventDto
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
  repoName = 'repoName',
  commitMessage = 'commitMessage',
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

export enum TimelineType {
  Program = 'Program',
  Website = 'Website',
  Tag = 'Tag',
  AutoTag = 'AutoTag',
  Calendar = 'Calendar',
  ActiveState = 'ActiveState',
  GitCommit = 'GitCommit',
  Productive = 'Productive',
}

// Database-backed timeline types that can be aggregated in Overviews.
// Calendar, GitCommit and AutoTag are excluded because they are not stored: they are produced
// per-request from an ICS feed, a git log scan, or by replaying the auto-tag rules.
export enum OverviewSourceType {
  Tag = 'Tag',
  Program = 'Program',
  Website = 'Website',
  ActiveState = 'ActiveState',
}

export enum DateRangeMode {
  Today = 'today',
  ThisWeek = 'thisWeek',
  ThisMonth = 'thisMonth',
  ThisYear = 'thisYear',
  Last7Days = 'last7Days',
  Last30Days = 'last30Days',
  Last365Days = 'last365Days',
  Custom = 'custom',
}

export interface SavedOverviewConfig {
  id: string;
  name: string;
  visualOrder: number;
  dateRangeMode: DateRangeMode;
  customStartedAt: string | null;
  customEndedAt: string | null;
  sourceTypes: OverviewSourceType[];
  reportState: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface OverviewFlatRow {
  id: string;
  category: string;
  sourceType: OverviewSourceType;
  startedAt: string;
  endedAt: string;
  date: string;
  week: string;
  month: string;
  durationHours: number;
  websiteDomain?: string;
  websiteTitle?: string;
  tagName?: string;
  tagCode?: string;
  tagColor?: string;
  programName?: string;
  windowTitle?: string;
  activeState?: string;
}

export interface Timeline {
  id: string;
  title: string;
  timelineType: TimelineType;
  eventProviderInfo: CalendarEventProviderInfoDto | GitCommitEventProviderInfoDto | null;
  createdAt: string;
  updatedAt: string;
  visualOrder: number;
  color: string | null;
}
