import {
  Activity,
  AppWindow,
  CalendarDays,
  Clock,
  Globe,
  Layers,
  ShieldCheck,
  Shuffle,
  Sunrise,
  Tag,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { DateRangeMode, OverviewSourceType } from '../../../types/types';
import {
  ChartType,
  Dimension,
  type ReportDefinition,
  ReportMetric,
  type ReportOptions,
  SortMode,
  SPLIT_NONE,
  type SplitOption,
  TimeBucket,
} from './report.types';
import { DIMENSION_LABELS, DIMENSION_SOURCE_TYPE } from './helpers/dimensions';
import {
  computeCalendar,
  computeCoverage,
  computeDistribution,
  computeHourOfDay,
  computeTopSessions,
  computeWorkdaySpan,
  createBucketedReport,
} from './helpers/compute';

export const REPORT_GROUPS = {
  distribution: 'Where the time goes',
  trends: 'Over time',
  patterns: 'Patterns',
  sessions: 'Sessions & focus',
};

export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  chartType: ChartType.Bar,
  metric: ReportMetric.Hours,
  dimension: Dimension.TagName,
  splitBy: SPLIT_NONE,
  bucket: TimeBucket.Day,
  topN: 10,
  sort: SortMode.ValueDesc,
  stacked: true,
  minDurationSeconds: 0,
  mergeGapMinutes: 5,
};

/** The source a dimension-driven report needs, derived from the dimension the user picked. */
const sourceFromDimension = (options: ReportOptions): OverviewSourceType[] => [
  DIMENSION_SOURCE_TYPE[options.dimension],
];

/** Sources for a report that also breaks its data down by a second dimension. */
const sourceFromDimensionAndSplit = (options: ReportOptions): OverviewSourceType[] => {
  const sources = new Set<OverviewSourceType>([DIMENSION_SOURCE_TYPE[options.dimension]]);
  if (options.splitBy !== SPLIT_NONE) {
    sources.add(DIMENSION_SOURCE_TYPE[options.splitBy as Dimension]);
  }
  return [...sources];
};

const DISTRIBUTION_CHARTS = [
  ChartType.BarHorizontal,
  ChartType.Bar,
  ChartType.Pie,
  ChartType.Donut,
  ChartType.Treemap,
  ChartType.Table,
];

const TREND_CHARTS = [ChartType.Bar, ChartType.Line, ChartType.Area, ChartType.Table];

const dimensionOptions = (dimensions: Dimension[]) =>
  dimensions.map((dimension) => ({ value: dimension, label: DIMENSION_LABELS[dimension] }));

const splitOptions = (dimensions: Dimension[]): SplitOption[] => [
  { value: SPLIT_NONE, label: 'Nothing (one total)' },
  ...dimensionOptions(dimensions),
];

/** The measures that represent "tracked time" and can be used interchangeably by most reports. */
const TIME_SOURCE_DIMENSIONS = [
  Dimension.ProgramName,
  Dimension.TagName,
  Dimension.WebsiteDomain,
  Dimension.ActiveState,
];

export const REPORTS: ReportDefinition[] = [
  // --- Where the time goes ---------------------------------------------------------------
  {
    id: 'time-per-tag',
    label: 'Time per tag',
    group: REPORT_GROUPS.distribution,
    description: 'Total tracked time per tag — the numbers you put on a timesheet.',
    icon: Tag,
    chartTypes: DISTRIBUTION_CHARTS,
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions([Dimension.TagName, Dimension.TagCode]),
      dimensionLabel: 'Group by',
      topN: true,
      sort: true,
    },
    defaults: { chartType: ChartType.BarHorizontal, dimension: Dimension.TagName, topN: 15 },
    defaultDateRangeMode: DateRangeMode.ThisMonth,
    sourceTypes: sourceFromDimension,
    compute: computeDistribution,
  },
  {
    id: 'time-per-program',
    label: 'Most used programs',
    group: REPORT_GROUPS.distribution,
    description: 'Which applications took the most time in the range.',
    icon: AppWindow,
    chartTypes: DISTRIBUTION_CHARTS,
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions([Dimension.ProgramName, Dimension.WindowTitle]),
      dimensionLabel: 'Group by',
      topN: true,
      sort: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.BarHorizontal,
      dimension: Dimension.ProgramName,
      topN: 15,
      minDurationSeconds: 5,
    },
    defaultDateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: sourceFromDimension,
    compute: computeDistribution,
  },
  {
    id: 'time-per-website',
    label: 'Most visited websites',
    group: REPORT_GROUPS.distribution,
    description: 'Browser time per domain, or per individual page title.',
    icon: Globe,
    chartTypes: DISTRIBUTION_CHARTS,
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions([Dimension.WebsiteDomain, Dimension.WebsiteTitle]),
      dimensionLabel: 'Group by',
      topN: true,
      sort: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.BarHorizontal,
      dimension: Dimension.WebsiteDomain,
      topN: 15,
      minDurationSeconds: 5,
    },
    defaultDateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: sourceFromDimension,
    compute: computeDistribution,
  },
  {
    id: 'rule-activations',
    label: 'Auto-tag rule activations',
    group: REPORT_GROUPS.distribution,
    description:
      'Which auto-tag rules fire most often, and how much time they tag. One activation is a continuous block of matched time.',
    icon: Zap,
    chartTypes: DISTRIBUTION_CHARTS,
    optionSpec: {
      metric: [ReportMetric.Count, ReportMetric.Hours],
      dimension: dimensionOptions([Dimension.AutoTagTitle, Dimension.AutoTagTagName]),
      dimensionLabel: 'Group by',
      topN: true,
      sort: true,
    },
    defaults: {
      chartType: ChartType.BarHorizontal,
      metric: ReportMetric.Count,
      dimension: Dimension.AutoTagTitle,
      topN: 15,
    },
    defaultDateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: sourceFromDimension,
    compute: computeDistribution,
  },

  // --- Over time -------------------------------------------------------------------------
  {
    id: 'activity-trend',
    label: 'Tracked time over time',
    group: REPORT_GROUPS.trends,
    description: 'How much time was tracked per day, week or month.',
    icon: TrendingUp,
    chartTypes: TREND_CHARTS,
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions(TIME_SOURCE_DIMENSIONS),
      dimensionLabel: 'Measure',
      splitBy: splitOptions(TIME_SOURCE_DIMENSIONS),
      bucket: [TimeBucket.Day, TimeBucket.Week, TimeBucket.Month],
      topN: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.Bar,
      dimension: Dimension.ProgramName,
      splitBy: SPLIT_NONE,
      bucket: TimeBucket.Day,
      topN: 8,
    },
    defaultDateRangeMode: DateRangeMode.Last30Days,
    sourceTypes: sourceFromDimensionAndSplit,
    compute: createBucketedReport({ kind: 'time' }),
  },
  {
    id: 'tag-mix-trend',
    label: 'Tag mix over time',
    group: REPORT_GROUPS.trends,
    description: 'Stacked tag totals per day, week or month — how the mix of work shifts.',
    icon: Layers,
    chartTypes: TREND_CHARTS,
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions([Dimension.TagName, Dimension.TagCode]),
      dimensionLabel: 'Measure',
      splitBy: splitOptions([Dimension.TagName, Dimension.TagCode]),
      bucket: [TimeBucket.Day, TimeBucket.Week, TimeBucket.Month],
      topN: true,
    },
    defaults: {
      chartType: ChartType.Bar,
      dimension: Dimension.TagName,
      splitBy: Dimension.TagName,
      bucket: TimeBucket.Day,
      topN: 8,
      stacked: true,
    },
    defaultDateRangeMode: DateRangeMode.ThisMonth,
    sourceTypes: sourceFromDimensionAndSplit,
    compute: createBucketedReport({ kind: 'time' }),
  },
  {
    id: 'active-vs-idle',
    label: 'Active vs idle time',
    group: REPORT_GROUPS.trends,
    description: 'Time at the keyboard versus time the machine sat idle.',
    icon: Activity,
    chartTypes: [
      ChartType.Bar,
      ChartType.Area,
      ChartType.Line,
      ChartType.Pie,
      ChartType.Donut,
      ChartType.Table,
    ],
    optionSpec: {
      bucket: [TimeBucket.Day, TimeBucket.Week, TimeBucket.Month],
    },
    defaults: {
      chartType: ChartType.Bar,
      dimension: Dimension.ActiveState,
      splitBy: Dimension.ActiveState,
      bucket: TimeBucket.Day,
      topN: 0,
      stacked: true,
    },
    defaultDateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: () => [OverviewSourceType.ActiveState],
    compute: createBucketedReport({ kind: 'time' }),
  },
  {
    id: 'tag-coverage',
    label: 'Tagged vs untagged time',
    group: REPORT_GROUPS.trends,
    description:
      'How much of your tracked time carries a tag — the time still waiting to be booked.',
    icon: ShieldCheck,
    chartTypes: [ChartType.Bar, ChartType.Area, ChartType.Line, ChartType.Pie, ChartType.Table],
    optionSpec: {
      dimension: dimensionOptions([Dimension.ProgramName, Dimension.ActiveState]),
      dimensionLabel: 'Tracked time from',
      bucket: [TimeBucket.Day, TimeBucket.Week, TimeBucket.Month],
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.Bar,
      dimension: Dimension.ProgramName,
      bucket: TimeBucket.Day,
      stacked: true,
    },
    defaultDateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: (options) => [
      DIMENSION_SOURCE_TYPE[options.dimension],
      OverviewSourceType.Tag,
    ],
    compute: computeCoverage,
  },

  // --- Patterns --------------------------------------------------------------------------
  {
    id: 'hour-of-day',
    label: 'Hour-of-day profile',
    group: REPORT_GROUPS.patterns,
    description: 'When during the day you work, as a profile or a weekday × hour heatmap.',
    icon: Clock,
    chartTypes: [ChartType.Bar, ChartType.Heatmap, ChartType.Line, ChartType.Area, ChartType.Table],
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions(TIME_SOURCE_DIMENSIONS),
      dimensionLabel: 'Measure',
      splitBy: splitOptions(TIME_SOURCE_DIMENSIONS),
      topN: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.Heatmap,
      dimension: Dimension.ProgramName,
      splitBy: SPLIT_NONE,
      topN: 8,
    },
    defaultDateRangeMode: DateRangeMode.Last30Days,
    sourceTypes: sourceFromDimensionAndSplit,
    compute: computeHourOfDay,
  },
  {
    id: 'day-of-week',
    label: 'Day-of-week profile',
    group: REPORT_GROUPS.patterns,
    description: 'Which weekdays carry the load, summed over the whole range.',
    icon: CalendarDays,
    chartTypes: [
      ChartType.Bar,
      ChartType.BarHorizontal,
      ChartType.Pie,
      ChartType.Donut,
      ChartType.Table,
    ],
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions(TIME_SOURCE_DIMENSIONS),
      dimensionLabel: 'Measure',
      splitBy: splitOptions(TIME_SOURCE_DIMENSIONS),
      topN: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.Bar,
      dimension: Dimension.ProgramName,
      splitBy: SPLIT_NONE,
      topN: 8,
    },
    defaultDateRangeMode: DateRangeMode.Last30Days,
    sourceTypes: sourceFromDimensionAndSplit,
    compute: createBucketedReport({ kind: 'weekday' }),
  },
  {
    id: 'calendar-heatmap',
    label: 'Calendar heatmap',
    group: REPORT_GROUPS.patterns,
    description: 'A day-by-day calendar of tracked hours. Best viewed over a month or a year.',
    icon: CalendarDays,
    chartTypes: [ChartType.Calendar, ChartType.Table],
    optionSpec: {
      metric: [ReportMetric.Hours, ReportMetric.Count],
      dimension: dimensionOptions(TIME_SOURCE_DIMENSIONS),
      dimensionLabel: 'Measure',
      minDuration: true,
    },
    defaults: { chartType: ChartType.Calendar, dimension: Dimension.ProgramName },
    defaultDateRangeMode: DateRangeMode.ThisYear,
    sourceTypes: sourceFromDimension,
    compute: computeCalendar,
  },
  {
    id: 'workday-span',
    label: 'Workday start & end',
    group: REPORT_GROUPS.patterns,
    description: 'First and last tracked activity per day, to see how workdays drift.',
    icon: Sunrise,
    chartTypes: [ChartType.Line, ChartType.Bar, ChartType.Table],
    optionSpec: {
      dimension: dimensionOptions(TIME_SOURCE_DIMENSIONS),
      dimensionLabel: 'Measure',
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.Line,
      dimension: Dimension.ProgramName,
      minDurationSeconds: 30,
    },
    defaultDateRangeMode: DateRangeMode.Last30Days,
    sourceTypes: sourceFromDimension,
    compute: computeWorkdaySpan,
  },

  // --- Sessions & focus ------------------------------------------------------------------
  {
    id: 'top-sessions',
    label: 'Longest focus sessions',
    group: REPORT_GROUPS.sessions,
    description:
      'The longest uninterrupted stretches spent on one thing. Consecutive events are merged.',
    icon: Timer,
    chartTypes: [ChartType.BarHorizontal, ChartType.Bar, ChartType.Table],
    optionSpec: {
      dimension: dimensionOptions([
        Dimension.ProgramName,
        Dimension.TagName,
        Dimension.WebsiteDomain,
        Dimension.WindowTitle,
      ]),
      dimensionLabel: 'Session of',
      topN: true,
      topNLabel: 'Show',
      sort: true,
      mergeGap: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.BarHorizontal,
      dimension: Dimension.ProgramName,
      topN: 15,
      mergeGapMinutes: 5,
      minDurationSeconds: 300,
    },
    defaultDateRangeMode: DateRangeMode.ThisWeek,
    sourceTypes: sourceFromDimension,
    compute: computeTopSessions,
  },
  {
    id: 'context-switches',
    label: 'Context switches',
    group: REPORT_GROUPS.sessions,
    description:
      'How often you switched between things per day, and how many distinct ones you touched.',
    icon: Shuffle,
    chartTypes: [ChartType.Bar, ChartType.Line, ChartType.Area, ChartType.Table],
    optionSpec: {
      metric: [ReportMetric.Count, ReportMetric.Unique],
      dimension: dimensionOptions([
        Dimension.ProgramName,
        Dimension.TagName,
        Dimension.WebsiteDomain,
        Dimension.WindowTitle,
      ]),
      dimensionLabel: 'Switches between',
      bucket: [TimeBucket.Day, TimeBucket.Week, TimeBucket.Month],
      mergeGap: true,
      minDuration: true,
    },
    defaults: {
      chartType: ChartType.Bar,
      metric: ReportMetric.Count,
      dimension: Dimension.ProgramName,
      splitBy: SPLIT_NONE,
      bucket: TimeBucket.Day,
      mergeGapMinutes: 1,
      minDurationSeconds: 5,
    },
    defaultDateRangeMode: DateRangeMode.Last30Days,
    sourceTypes: sourceFromDimension,
    compute: createBucketedReport({ kind: 'time', useSessions: true }),
  },
];

export const DEFAULT_REPORT_ID = REPORTS[0].id;

export function findReport(reportId: string | undefined): ReportDefinition | undefined {
  return REPORTS.find((report) => report.id === reportId);
}

/** Report defaults layered over the global defaults, so every option always has a value. */
export function getReportDefaults(report: ReportDefinition): ReportOptions {
  return { ...DEFAULT_REPORT_OPTIONS, ...report.defaults };
}
