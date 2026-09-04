import { format, parseISO, startOfDay } from 'date-fns';
import type { OverviewFlatRowDto } from '../../../../api/overviews';
import { OverviewSourceType } from '../../../../types/types';
import {
  ChartType,
  Dimension,
  type MatrixReportResult,
  ReportContext,
  ReportMetric,
  type ReportResult,
  type ReportSeries,
  type SeriesReportResult,
  SortMode,
  SPLIT_NONE,
  TimeBucket,
  type ValueUnit,
} from '../report.types';
import { DIMENSION_LABELS, DIMENSION_SOURCE_TYPE, getDimensionValue, getDimensionColor } from './dimensions';
import {
  applyTopN,
  indexRowsByDimension,
  intersectIntervals,
  type LabelledTotal,
  OTHER_LABEL,
  rowsToIntervals,
  toSessions,
  unionIntervals,
} from './aggregate';
import {
  enumerateBuckets,
  enumerateDays,
  formatBucketLabel,
  getBucketKey,
  HOUR_LABELS,
  splitIntervalByBucket,
  splitIntervalByHour,
  WEEKDAY_LABELS,
} from './time-buckets';

const MS_PER_HOUR = 3_600_000;

function unitFor(metric: ReportMetric): ValueUnit {
  return metric === ReportMetric.Hours ? 'hours' : 'count';
}

/** The rows a report works on: the source the dimension belongs to, minus events filtered out. */
function sourceRows(context: ReportContext, dimension = context.options.dimension) {
  const sourceType = DIMENSION_SOURCE_TYPE[dimension];
  const minHours = context.options.minDurationSeconds / 3600;
  return context.rows.filter(
    (row) => row.sourceType === sourceType && row.durationHours >= minHours
  );
}

function emptySeriesResult(categoryLabel: string, valueUnit: ValueUnit): SeriesReportResult {
  return { kind: 'series', categories: [], series: [], valueUnit, categoryLabel };
}

// --- Distribution: one bar/slice per value of the chosen dimension -------------------------

export function computeDistribution(context: ReportContext): ReportResult {
  const { options } = context;
  const rows = sourceRows(context);
  const dimension = options.dimension;
  const valueUnit = unitFor(options.metric);

  const totalsByLabel = new Map<string, number>();
  for (const row of rows) {
    const label = getDimensionValue(row, dimension);
    const value = options.metric === ReportMetric.Hours ? row.durationHours : 1;
    totalsByLabel.set(label, (totalsByLabel.get(label) ?? 0) + value);
  }

  const totals: LabelledTotal[] = [...totalsByLabel].map(([label, value]) => ({ label, value }));
  const entries = applyTopN(totals, options.topN, options.sort);
  const rowsByLabel = indexRowsByDimension(rows, dimension);

  return {
    kind: 'series',
    categories: entries.map((entry) => entry.label),
    categoryColors: entries.map((entry) =>
      entry.label === OTHER_LABEL ? '#9ca3af' : getDimensionColor(entry.label, dimension, rowsByLabel)
    ),
    series: [
      {
        name: options.metric === ReportMetric.Hours ? 'Time' : 'Events',
        data: entries.map((entry) => entry.value),
      },
    ],
    valueUnit,
    categoryLabel: DIMENSION_LABELS[dimension],
  };
}

// --- Bucketed: categories are time buckets, hours of the day, or weekdays -----------------

type BucketKind = 'time' | 'hourOfDay' | 'weekday';

interface BucketedConfig {
  kind: BucketKind;
  /** Count sessions instead of raw events (used by the context-switch report). */
  useSessions?: boolean;
}

function bucketSlices(
  row: OverviewFlatRowDto,
  kind: BucketKind,
  bucket: TimeBucket
): { key: string; hours: number }[] {
  if (kind === 'time') return splitIntervalByBucket(row.startedAt, row.endedAt, bucket);
  return splitIntervalByHour(row.startedAt, row.endedAt).map((slice) => ({
    key: kind === 'hourOfDay' ? HOUR_LABELS[slice.hour] : WEEKDAY_LABELS[slice.weekdayIndex],
    hours: slice.hours,
  }));
}

function bucketKeyOfStart(row: OverviewFlatRowDto, kind: BucketKind, bucket: TimeBucket): string {
  const start = parseISO(row.startedAt);
  if (kind === 'time') return getBucketKey(start, bucket);
  if (kind === 'hourOfDay') return HOUR_LABELS[start.getHours()];
  return WEEKDAY_LABELS[(start.getDay() + 6) % 7];
}

function bucketCategories(context: ReportContext, kind: BucketKind): { keys: string[]; labels: string[] } {
  if (kind === 'hourOfDay') return { keys: HOUR_LABELS, labels: HOUR_LABELS };
  if (kind === 'weekday') return { keys: WEEKDAY_LABELS, labels: WEEKDAY_LABELS };
  const keys = enumerateBuckets(context.startedAt, context.endedAt, context.options.bucket);
  return { keys, labels: keys.map((key) => formatBucketLabel(key, context.options.bucket)) };
}

export function createBucketedReport(config: BucketedConfig) {
  return function computeBucketed(context: ReportContext): ReportResult {
    const { options } = context;
    const rows = sourceRows(context);
    const dimension = options.dimension;
    const { keys, labels } = bucketCategories(context, config.kind);
    const keyIndex = new Map(keys.map((key, index) => [key, index]));

    // Which values become series. SPLIT_NONE keeps everything in one series.
    const splitDimension = options.splitBy === SPLIT_NONE ? null : (options.splitBy as Dimension);

    if (options.metric === ReportMetric.Unique) {
      return computeUniquePerBucket(context, config, keys, labels);
    }

    if (config.useSessions) {
      return computeSessionsPerBucket(context, config, keys, labels, splitDimension);
    }

    const totalsBySeries = new Map<string, number[]>();
    const addValue = (seriesLabel: string, bucketKey: string, value: number) => {
      const index = keyIndex.get(bucketKey);
      if (index === undefined) return;
      let values = totalsBySeries.get(seriesLabel);
      if (!values) {
        values = new Array(keys.length).fill(0);
        totalsBySeries.set(seriesLabel, values);
      }
      values[index] += value;
    };

    for (const row of rows) {
      const seriesLabel = splitDimension ? getDimensionValue(row, splitDimension) : 'Total';
      if (options.metric === ReportMetric.Hours) {
        for (const slice of bucketSlices(row, config.kind, options.bucket)) {
          addValue(seriesLabel, slice.key, slice.hours);
        }
      } else {
        // An event is counted once, in the bucket it started in.
        addValue(seriesLabel, bucketKeyOfStart(row, config.kind, options.bucket), 1);
      }
    }

    const series = buildSeries(
      context,
      totalsBySeries,
      splitDimension,
      rows,
      options.metric === ReportMetric.Hours ? 'Time' : 'Events',
      keys.length
    );

    return {
      kind: 'series',
      categories: labels,
      series,
      valueUnit: unitFor(options.metric),
      categoryLabel: bucketCategoryLabel(context, config.kind),
      categoriesAreTimeBuckets: config.kind === 'time',
    };
  };
}

function bucketCategoryLabel(context: ReportContext, kind: BucketKind): string {
  if (kind === 'hourOfDay') return 'Hour of day';
  if (kind === 'weekday') return 'Day of week';
  return context.options.bucket === TimeBucket.Day
    ? 'Day'
    : context.options.bucket === TimeBucket.Week
      ? 'Week'
      : 'Month';
}

/**
 * Turns the per-series totals into chart series: unsplit reports keep their single series, split
 * reports keep only the biggest values and fold the rest into "Other".
 */
function buildSeries(
  context: ReportContext,
  totalsBySeries: Map<string, number[]>,
  splitDimension: Dimension | null,
  rows: OverviewFlatRowDto[],
  singleSeriesName: string,
  bucketCount: number
): ReportSeries[] {
  const { options } = context;

  if (!splitDimension) {
    return [
      { name: singleSeriesName, data: totalsBySeries.get('Total') ?? new Array(bucketCount).fill(0) },
    ];
  }

  const totals: LabelledTotal[] = [...totalsBySeries].map(([label, values]) => ({
    label,
    value: values.reduce((total, value) => total + value, 0),
  }));
  const kept = applyTopN(totals, options.topN, SortMode.ValueDesc);
  const keptLabels = new Set(kept.map((entry) => entry.label));
  const rowsByLabel = indexRowsByDimension(rows, splitDimension);

  const series: ReportSeries[] = kept
    .filter((entry) => entry.label !== OTHER_LABEL)
    .map((entry) => ({
      name: entry.label,
      color: getDimensionColor(entry.label, splitDimension, rowsByLabel),
      data: totalsBySeries.get(entry.label) ?? new Array(bucketCount).fill(0),
    }));

  if (keptLabels.has(OTHER_LABEL)) {
    const otherValues = new Array(bucketCount).fill(0);
    for (const [label, values] of totalsBySeries) {
      if (keptLabels.has(label)) continue;
      values.forEach((value, index) => (otherValues[index] += value));
    }
    series.push({ name: OTHER_LABEL, color: '#9ca3af', data: otherValues });
  }

  return series;
}

function computeUniquePerBucket(
  context: ReportContext,
  config: BucketedConfig,
  keys: string[],
  labels: string[]
): SeriesReportResult {
  const rows = sourceRows(context);
  const dimension = context.options.dimension;
  const seen = keys.map(() => new Set<string>());
  const keyIndex = new Map(keys.map((key, index) => [key, index]));

  for (const row of rows) {
    const index = keyIndex.get(bucketKeyOfStart(row, config.kind, context.options.bucket));
    if (index === undefined) continue;
    seen[index].add(getDimensionValue(row, dimension));
  }

  return {
    kind: 'series',
    categories: labels,
    series: [{ name: 'Distinct ' + DIMENSION_LABELS[dimension].toLowerCase() + 's', data: seen.map((set) => set.size) }],
    valueUnit: 'count',
    categoryLabel: bucketCategoryLabel(context, config.kind),
    categoriesAreTimeBuckets: config.kind === 'time',
  };
}

function computeSessionsPerBucket(
  context: ReportContext,
  config: BucketedConfig,
  keys: string[],
  labels: string[],
  splitDimension: Dimension | null
): SeriesReportResult {
  const { options } = context;
  const rows = sourceRows(context);
  const sessions = toSessions(rows, options.dimension, options.mergeGapMinutes);
  const keyIndex = new Map(keys.map((key, index) => [key, index]));
  const totalsBySeries = new Map<string, number[]>();

  for (const session of sessions) {
    const start = parseISO(session.startedAt);
    const key =
      config.kind === 'time'
        ? getBucketKey(start, options.bucket)
        : config.kind === 'hourOfDay'
          ? HOUR_LABELS[start.getHours()]
          : WEEKDAY_LABELS[(start.getDay() + 6) % 7];
    const index = keyIndex.get(key);
    if (index === undefined) continue;

    const seriesLabel = splitDimension ? session.label : 'Total';
    let values = totalsBySeries.get(seriesLabel);
    if (!values) {
      values = new Array(keys.length).fill(0);
      totalsBySeries.set(seriesLabel, values);
    }
    values[index] += options.metric === ReportMetric.Hours ? session.hours : 1;
  }

  return {
    kind: 'series',
    categories: labels,
    series: buildSeries(context, totalsBySeries, splitDimension, rows, 'Sessions', keys.length),
    valueUnit: unitFor(options.metric),
    categoryLabel: bucketCategoryLabel(context, config.kind),
    categoriesAreTimeBuckets: config.kind === 'time',
  };
}

// --- Hour-of-day: a bar per hour, or a weekday x hour heatmap -----------------------------

const hourOfDayBars = createBucketedReport({ kind: 'hourOfDay' });

export function computeHourOfDay(context: ReportContext): ReportResult {
  if (context.options.chartType !== ChartType.Heatmap) return hourOfDayBars(context);

  const rows = sourceRows(context);
  const cells = new Map<string, number>();
  for (const row of rows) {
    for (const slice of splitIntervalByHour(row.startedAt, row.endedAt)) {
      const key = slice.hour + '|' + slice.weekdayIndex;
      const value = context.options.metric === ReportMetric.Hours ? slice.hours : 1;
      cells.set(key, (cells.get(key) ?? 0) + value);
    }
  }

  const result: MatrixReportResult = {
    kind: 'matrix',
    xLabels: HOUR_LABELS,
    yLabels: WEEKDAY_LABELS,
    cells: [...cells].map(([key, value]) => {
      const [hour, weekday] = key.split('|').map(Number);
      return [hour, weekday, value] as [number, number, number];
    }),
    valueUnit: unitFor(context.options.metric),
    categoryLabel: 'Hour of day',
  };
  return result;
}

// --- Calendar heatmap ---------------------------------------------------------------------

export function computeCalendar(context: ReportContext): ReportResult {
  const rows = sourceRows(context);
  const days = enumerateDays(context.startedAt, context.endedAt);
  const totals = new Map<string, number>(days.map((day) => [day, 0]));

  for (const row of rows) {
    if (context.options.metric === ReportMetric.Hours) {
      for (const slice of splitIntervalByBucket(row.startedAt, row.endedAt, TimeBucket.Day)) {
        if (totals.has(slice.key)) totals.set(slice.key, (totals.get(slice.key) ?? 0) + slice.hours);
      }
    } else {
      const key = format(parseISO(row.startedAt), 'yyyy-MM-dd');
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + 1);
    }
  }

  return {
    kind: 'calendar',
    days: [...totals].map(([date, value]) => ({ date, value })),
    range: [days[0] ?? format(new Date(), 'yyyy-MM-dd'), days.at(-1) ?? format(new Date(), 'yyyy-MM-dd')],
    valueUnit: unitFor(context.options.metric),
    categoryLabel: 'Day',
  };
}

// --- Tagged vs untagged coverage ----------------------------------------------------------

export function computeCoverage(context: ReportContext): ReportResult {
  const { options } = context;
  const minHours = options.minDurationSeconds / 3600;
  const trackedRows = context.rows.filter(
    (row) => row.sourceType === DIMENSION_SOURCE_TYPE[options.dimension] && row.durationHours >= minHours
  );
  const tagRows = context.rows.filter((row) => row.sourceType === OverviewSourceType.Tag);

  const tracked = unionIntervals(rowsToIntervals(trackedRows));
  const tagged = intersectIntervals(tracked, unionIntervals(rowsToIntervals(tagRows)));

  const keys = enumerateBuckets(context.startedAt, context.endedAt, options.bucket);
  const keyIndex = new Map(keys.map((key, index) => [key, index]));
  const trackedPerBucket = new Array(keys.length).fill(0);
  const taggedPerBucket = new Array(keys.length).fill(0);

  const addIntervals = (intervals: [number, number][], target: number[]) => {
    for (const [start, end] of intervals) {
      for (const slice of splitIntervalByBucket(
        new Date(start).toISOString(),
        new Date(end).toISOString(),
        options.bucket
      )) {
        const index = keyIndex.get(slice.key);
        if (index !== undefined) target[index] += slice.hours;
      }
    }
  };
  addIntervals(tracked, trackedPerBucket);
  addIntervals(tagged, taggedPerBucket);

  return {
    kind: 'series',
    categories: keys.map((key) => formatBucketLabel(key, options.bucket)),
    series: [
      { name: 'Tagged', color: '#22c55e', data: taggedPerBucket },
      {
        name: 'Untagged',
        color: '#f97316',
        data: trackedPerBucket.map((tracked, index) =>
          Math.max(0, tracked - taggedPerBucket[index])
        ),
      },
    ],
    valueUnit: 'hours',
    categoryLabel: bucketCategoryLabel(context, 'time'),
    categoriesAreTimeBuckets: true,
  };
}

// --- Workday start & end ------------------------------------------------------------------

export function computeWorkdaySpan(context: ReportContext): ReportResult {
  const rows = sourceRows(context);
  const days = enumerateDays(context.startedAt, context.endedAt);
  const dayIndex = new Map(days.map((day, index) => [day, index]));
  const first: (number | null)[] = days.map(() => null);
  const last: (number | null)[] = days.map(() => null);

  const hourOfDay = (date: Date) =>
    (date.getTime() - startOfDay(date).getTime()) / MS_PER_HOUR;

  for (const row of rows) {
    const start = parseISO(row.startedAt);
    const index = dayIndex.get(format(start, 'yyyy-MM-dd'));
    if (index === undefined) continue;
    const startHour = hourOfDay(start);
    const end = parseISO(row.endedAt);
    // An event running past midnight still ends "that day" as far as the workday span goes.
    const endHour = Math.min(24, hourOfDay(start) + (end.getTime() - start.getTime()) / MS_PER_HOUR);
    if (first[index] === null || startHour < (first[index] as number)) first[index] = startHour;
    if (last[index] === null || endHour > (last[index] as number)) last[index] = endHour;
  }

  return {
    kind: 'series',
    categories: days.map((day) => format(parseISO(day), 'EEE d MMM')),
    series: [
      { name: 'First activity', color: '#38bdf8', data: first },
      { name: 'Last activity', color: '#6366f1', data: last },
    ],
    valueUnit: 'timeOfDay',
    categoryLabel: 'Day',
    categoriesAreTimeBuckets: true,
  };
}

// --- Longest sessions ---------------------------------------------------------------------

export function computeTopSessions(context: ReportContext): ReportResult {
  const { options } = context;
  const rows = sourceRows(context);
  const sessions = toSessions(rows, options.dimension, options.mergeGapMinutes)
    .filter((session) => session.hours * 3600 >= options.minDurationSeconds)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, options.topN || 15);

  if (!sessions.length) return emptySeriesResult(DIMENSION_LABELS[options.dimension], 'hours');

  const rowsByLabel = indexRowsByDimension(rows, options.dimension);
  const ordered =
    options.sort === SortMode.ValueAsc ? [...sessions].reverse() : sessions;

  return {
    kind: 'series',
    categories: ordered.map(
      (session) => session.label + ' · ' + format(parseISO(session.startedAt), 'EEE d MMM HH:mm')
    ),
    categoryColors: ordered.map((session) =>
      getDimensionColor(session.label, options.dimension, rowsByLabel)
    ),
    series: [{ name: 'Session length', data: ordered.map((session) => session.hours) }],
    valueUnit: 'hours',
    categoryLabel: 'Session',
  };
}
