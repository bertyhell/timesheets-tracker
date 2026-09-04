import type { LucideIcon } from 'lucide-react';
import { DateRangeMode, OverviewSourceType } from '../../../types/types';
import type { OverviewFlatRowDto } from '../../../api/overviews';

export enum ChartType {
  Bar = 'bar',
  BarHorizontal = 'barHorizontal',
  Line = 'line',
  Area = 'area',
  Pie = 'pie',
  Donut = 'donut',
  Treemap = 'treemap',
  Heatmap = 'heatmap',
  Calendar = 'calendar',
  Table = 'table',
}

export enum ReportMetric {
  /** Total time, summed per category. */
  Hours = 'hours',
  /** Number of events / activations / sessions. */
  Count = 'count',
  /** Number of distinct values of the measured dimension. */
  Unique = 'unique',
}

export enum TimeBucket {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

export enum SortMode {
  ValueDesc = 'valueDesc',
  ValueAsc = 'valueAsc',
  Label = 'label',
  LabelDesc = 'labelDesc',
}

/**
 * A field of the flat overview rows that categories can be built from. Every dimension belongs to
 * exactly one source type, which is what tells the view which data to fetch for a report.
 */
export enum Dimension {
  TagName = 'tagName',
  TagCode = 'tagCode',
  ProgramName = 'programName',
  WindowTitle = 'windowTitle',
  WebsiteDomain = 'websiteDomain',
  WebsiteTitle = 'websiteTitle',
  ActiveState = 'activeState',
}

/** Value of the "split by" option that means "one single series". */
export const SPLIT_NONE = 'none';

export interface ReportOptions {
  chartType: ChartType;
  metric: ReportMetric;
  /** What is measured / grouped: also decides which source type gets fetched. */
  dimension: Dimension;
  /** Extra breakdown into one series per value, or SPLIT_NONE. */
  splitBy: Dimension | typeof SPLIT_NONE;
  bucket: TimeBucket;
  /** Keep only the N biggest categories and fold the rest into "Other". 0 keeps everything. */
  topN: number;
  sort: SortMode;
  stacked: boolean;
  /** Drops very short events, which are mostly window-switch noise. */
  minDurationSeconds: number;
  /** Gap up to which consecutive events with the same value count as one session. */
  mergeGapMinutes: number;
}

export type ValueUnit = 'hours' | 'count' | 'timeOfDay';

export interface ReportSeries {
  name: string;
  color?: string;
  /** null renders as a gap, which is what a day without any tracked time should look like. */
  data: (number | null)[];
}

export interface SeriesReportResult {
  kind: 'series';
  categories: string[];
  /** Per-category colors, used by the single-series charts (bar, pie, treemap). */
  categoryColors?: (string | undefined)[];
  series: ReportSeries[];
  valueUnit: ValueUnit;
  categoryLabel: string;
  /** Set when categories are time buckets, so the renderer can offer zooming. */
  categoriesAreTimeBuckets?: boolean;
}

export interface MatrixReportResult {
  kind: 'matrix';
  xLabels: string[];
  yLabels: string[];
  /** [xIndex, yIndex, value] triples. */
  cells: [number, number, number][];
  valueUnit: ValueUnit;
  categoryLabel: string;
}

export interface CalendarReportResult {
  kind: 'calendar';
  days: { date: string; value: number }[];
  /** Inclusive [first, last] day, as 'yyyy-MM-dd'. */
  range: [string, string];
  valueUnit: ValueUnit;
  categoryLabel: string;
}

export type ReportResult = SeriesReportResult | MatrixReportResult | CalendarReportResult;

export interface DimensionOption {
  value: Dimension;
  label: string;
}

export interface SplitOption {
  value: Dimension | typeof SPLIT_NONE;
  label: string;
}

/** Declares which option controls a report shows. Anything omitted is not tweakable. */
export interface ReportOptionSpec {
  metric?: ReportMetric[];
  dimension?: DimensionOption[];
  dimensionLabel?: string;
  splitBy?: SplitOption[];
  bucket?: TimeBucket[];
  topN?: boolean;
  topNLabel?: string;
  sort?: boolean;
  minDuration?: boolean;
  mergeGap?: boolean;
}

export interface ReportContext {
  rows: OverviewFlatRowDto[];
  options: ReportOptions;
  startedAt: string;
  endedAt: string;
}

export interface ReportDefinition {
  id: string;
  label: string;
  group: string;
  description: string;
  icon: LucideIcon;
  chartTypes: ChartType[];
  optionSpec: ReportOptionSpec;
  defaults: Partial<ReportOptions>;
  defaultDateRangeMode: DateRangeMode;
  /** Which data the view has to load for this report, given its current options. */
  sourceTypes: (options: ReportOptions) => OverviewSourceType[];
  compute: (context: ReportContext) => ReportResult;
}

/** What gets persisted on a saved overview: the chosen report plus its tweaked options. */
export interface ReportState {
  reportId: string;
  options: ReportOptions;
}
