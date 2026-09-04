import {
  ChartType,
  Dimension,
  type ReportDefinition,
  ReportMetric,
  type ReportOptions,
  type ReportState,
  SortMode,
  SPLIT_NONE,
  TimeBucket,
} from '../report.types';
import { findReport, getReportDefaults } from '../report-catalog';

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/**
 * Rebuilds a usable set of options from whatever was persisted. Saved overviews created before
 * the report engine (or edited by hand) can hold anything, so every field falls back to the
 * report's own default instead of trusting the stored value.
 */
export function resolveReportOptions(
  report: ReportDefinition,
  stored: unknown
): ReportOptions {
  const defaults = getReportDefaults(report);
  const raw = (stored ?? {}) as Partial<ReportOptions>;

  const chartType = isOneOf(raw.chartType, report.chartTypes) ? raw.chartType : defaults.chartType;
  const allowedMetrics = report.optionSpec.metric ?? [defaults.metric];
  const allowedDimensions = (report.optionSpec.dimension ?? []).map((option) => option.value);
  const allowedSplits = (report.optionSpec.splitBy ?? []).map((option) => option.value);
  const allowedBuckets = report.optionSpec.bucket ?? [defaults.bucket];

  return {
    chartType,
    metric: isOneOf(raw.metric, allowedMetrics) ? raw.metric : defaults.metric,
    dimension: isOneOf(raw.dimension, allowedDimensions) ? raw.dimension : defaults.dimension,
    splitBy: isOneOf(raw.splitBy, allowedSplits) ? raw.splitBy : defaults.splitBy,
    bucket: isOneOf(raw.bucket, allowedBuckets) ? raw.bucket : defaults.bucket,
    topN: typeof raw.topN === 'number' && raw.topN >= 0 ? raw.topN : defaults.topN,
    sort: isOneOf(raw.sort, Object.values(SortMode)) ? raw.sort : defaults.sort,
    stacked: typeof raw.stacked === 'boolean' ? raw.stacked : defaults.stacked,
    minDurationSeconds:
      typeof raw.minDurationSeconds === 'number' && raw.minDurationSeconds >= 0
        ? raw.minDurationSeconds
        : defaults.minDurationSeconds,
    mergeGapMinutes:
      typeof raw.mergeGapMinutes === 'number' && raw.mergeGapMinutes >= 0
        ? raw.mergeGapMinutes
        : defaults.mergeGapMinutes,
  };
}

/** Report + options for a persisted state, falling back to the given report when unusable. */
export function resolveReportState(
  stored: Record<string, any> | null | undefined,
  fallbackReport: ReportDefinition
): { report: ReportDefinition; options: ReportOptions } {
  const report = findReport(stored?.reportId) ?? fallbackReport;
  return { report, options: resolveReportOptions(report, stored?.options) };
}

export function toReportState(report: ReportDefinition, options: ReportOptions): ReportState {
  return { reportId: report.id, options };
}

/**
 * Keeps options consistent when the user switches report: anything the new report does not
 * support is replaced by its own default, and anything it does support is carried over.
 */
export function migrateOptionsToReport(
  report: ReportDefinition,
  currentOptions: ReportOptions
): ReportOptions {
  return resolveReportOptions(report, currentOptions);
}

export const CHART_TYPE_LABELS: Record<ChartType, string> = {
  [ChartType.Bar]: 'Bars',
  [ChartType.BarHorizontal]: 'Horizontal bars',
  [ChartType.Line]: 'Line',
  [ChartType.Area]: 'Area',
  [ChartType.Pie]: 'Pie',
  [ChartType.Donut]: 'Donut',
  [ChartType.Treemap]: 'Treemap',
  [ChartType.Heatmap]: 'Heatmap',
  [ChartType.Calendar]: 'Calendar',
  [ChartType.Table]: 'Table',
};

export const METRIC_LABELS: Record<ReportMetric, string> = {
  [ReportMetric.Hours]: 'Total time',
  [ReportMetric.Count]: 'Number of events',
  [ReportMetric.Unique]: 'Distinct values',
};

export const BUCKET_LABELS: Record<TimeBucket, string> = {
  [TimeBucket.Day]: 'Per day',
  [TimeBucket.Week]: 'Per week',
  [TimeBucket.Month]: 'Per month',
};

export const SORT_LABELS: Record<SortMode, string> = {
  [SortMode.ValueDesc]: 'Biggest first',
  [SortMode.ValueAsc]: 'Smallest first',
  [SortMode.Label]: 'By name',
};

export const TOP_N_OPTIONS: { value: number; label: string }[] = [
  { value: 5, label: 'Top 5' },
  { value: 10, label: 'Top 10' },
  { value: 15, label: 'Top 15' },
  { value: 25, label: 'Top 25' },
  { value: 0, label: 'Everything' },
];

export const MIN_DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Keep everything' },
  { value: 5, label: 'Ignore < 5 sec' },
  { value: 30, label: 'Ignore < 30 sec' },
  { value: 60, label: 'Ignore < 1 min' },
  { value: 300, label: 'Ignore < 5 min' },
];

export const MERGE_GAP_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'No gap' },
  { value: 1, label: 'Bridge 1 min gaps' },
  { value: 5, label: 'Bridge 5 min gaps' },
  { value: 15, label: 'Bridge 15 min gaps' },
];

/** Kept in sync with the enum so the "split by" default has a label to show. */
export const SPLIT_NONE_LABEL = 'Nothing (one total)';
export { SPLIT_NONE, Dimension };
