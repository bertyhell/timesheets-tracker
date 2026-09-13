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
  tagName?: TagName;
}

export interface TagName {
  id: string;
  title: string;
  code: string;
  color: string;
  note?: string | null;
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
  /** yyyy-MM-dd, inclusive. null/undefined means the rule has no start bound. */
  activeFrom?: string | null;
  /** yyyy-MM-dd, inclusive to the end of that day. null/undefined means no end bound. */
  activeUntil?: string | null;
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
  repoName = 'repoName',
  commitMessage = 'commitMessage',

  fileName = 'fileName',
  filePath = 'filePath',
  fileExtension = 'fileExtension',

  jiraIssueKey = 'jiraIssueKey',
  jiraSummary = 'jiraSummary',
  jiraProjectKey = 'jiraProjectKey',
  jiraProjectName = 'jiraProjectName',
  jiraLabels = 'jiraLabels',
  jiraFixVersions = 'jiraFixVersions',
  jiraComponents = 'jiraComponents',
  jiraSprint = 'jiraSprint',
  jiraAssignee = 'jiraAssignee',
  jiraReporter = 'jiraReporter',
  jiraStatus = 'jiraStatus',
  jiraIssueType = 'jiraIssueType',
  jiraPriority = 'jiraPriority',
  jiraParentKey = 'jiraParentKey',
  jiraParentSummary = 'jiraParentSummary',
}

export enum ConditionOperator {
  contains = 'contains',
  doesNotContains = 'doesNotContains',
  isExact = 'isExact',
  isNotExact = 'isNotExact',
  matchesRegex = 'matchesRegex',
  doesNotMatchRegex = 'doesNotMatchRegex',
}

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
  Last90Days = 'last90Days',
  Last365Days = 'last365Days',
  Custom = 'custom',
}

/**
 * What a single column of the Excel CSV export puts in each row.
 *
 * A row is one tag name on one day, so the time-ish values are aggregates: `Duration` is the summed
 * length of that tag's events, `Start`/`End` the earliest and latest of them.
 */
export enum CsvColumnValue {
  TagName = 'tagName',
  TagCode = 'tagCode',
  TagNote = 'tagNote',
  Notes = 'notes',
  Duration = 'duration',
  Start = 'start',
  End = 'end',
  Date = 'date',
  TimelineName = 'timelineName',
  StaticText = 'staticText',
}

/**
 * How a numeric or temporal column value is rendered.
 *
 * The values are prefixed by family because the families overlap: a duration of "HH:mm" (1h30 as
 * 01:30) and a time of day of "HH:mm" (half past one) are the same mask over different numbers, so
 * an unprefixed 'HH:mm' could not tell the format dropdown which family it came from. Only the
 * prefix is internal — the settings screen shows the part after the colon.
 */
export enum CsvValueFormat {
  /** Total hours worked, zero-padded: 7h30 -> "07:30:00". */
  DurationHoursMinutesSeconds = 'duration:HH:mm:ss',
  DurationHoursMinutes = 'duration:HH:mm',
  /** Decimal hours, the shape most timesheet spreadsheets add up: 7h30 -> "7.5". */
  DurationDecimalOne = 'duration:HH.H',
  DurationDecimalTwo = 'duration:HH.HH',
  /** Total minutes as a plain number: 7h30 -> "450". */
  DurationMinutes = 'duration:m',
  /** The way durations read everywhere else in the app: "7h 30m". */
  DurationHuman = 'duration:human',

  TimeHoursMinutes = 'time:HH:mm',
  TimeHoursMinutesSeconds = 'time:HH:mm:ss',
  TimeDateAndHoursMinutes = 'time:yyyy-MM-dd HH:mm',
  TimeIso = 'time:iso',

  DateIso = 'date:yyyy-MM-dd',
  DateDayMonthYearSlash = 'date:dd/MM/yyyy',
  DateMonthDayYearSlash = 'date:MM/dd/yyyy',
  DateDayMonthYearDash = 'date:dd-MM-yyyy',
  /** Weekday in front of the date, for timesheets that are read a day at a time. */
  DateWeekdayShort = 'date:EEE dd/MM/yyyy',
  DateWeekdayLong = 'date:EEEE dd/MM/yyyy',
}

/**
 * Field separator of the produced file. Excel picks its separator from the OS list separator
 * rather than from the file, so a comma-decimal locale (most of Europe) needs the semicolon or
 * every row lands in a single column.
 */
export enum CsvDelimiter {
  Comma = ',',
  Semicolon = ';',
  Tab = '\t',
}

/** One configured column of the Excel CSV export. */
export interface CsvExportColumn {
  id: string;
  header: string;
  value: CsvColumnValue;
  /** Empty for the text values, which have nothing to format. */
  format: CsvValueFormat | '';
  /** Only read when `value` is `CsvColumnValue.StaticText`. */
  staticText: string;
  visualOrder: number;
}
