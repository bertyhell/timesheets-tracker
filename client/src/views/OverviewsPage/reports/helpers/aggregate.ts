import { parseISO } from 'date-fns';
import type { OverviewFlatRowDto } from '../../../../api/overviews';
import { Dimension, SortMode } from '../report.types';
import { getDimensionValue } from './dimensions';

export const OTHER_LABEL = 'Other';

export interface LabelledTotal {
  label: string;
  value: number;
}

export function sortTotals(totals: LabelledTotal[], sort: SortMode): LabelledTotal[] {
  const sorted = [...totals];
  switch (sort) {
    case SortMode.ValueDesc:
      return sorted.sort((a, b) => b.value - a.value);
    case SortMode.ValueAsc:
      return sorted.sort((a, b) => a.value - b.value);
    case SortMode.Label:
      return sorted.sort((a, b) => a.label.localeCompare(b.label));
    case SortMode.LabelDesc:
      return sorted.sort((a, b) => b.label.localeCompare(a.label));
  }
}

/**
 * Keeps the N biggest entries and folds the tail into a single "Other" entry, so a chart of
 * hundreds of window titles stays readable without hiding time from the totals.
 */
export function applyTopN(totals: LabelledTotal[], topN: number, sort: SortMode): LabelledTotal[] {
  if (!topN || totals.length <= topN) return sortTotals(totals, sort);

  const byValue = sortTotals(totals, SortMode.ValueDesc);
  const kept = byValue.slice(0, topN);
  const otherValue = byValue.slice(topN).reduce((total, entry) => total + entry.value, 0);
  const result = sortTotals(kept, sort);
  if (otherValue > 0) result.push({ label: OTHER_LABEL, value: otherValue });
  return result;
}

/** First row per dimension value, used to look up a value's tag color. */
export function indexRowsByDimension(
  rows: OverviewFlatRowDto[],
  dimension: Dimension
): Map<string, OverviewFlatRowDto> {
  const index = new Map<string, OverviewFlatRowDto>();
  for (const row of rows) {
    const label = getDimensionValue(row, dimension);
    if (!index.has(label)) index.set(label, row);
  }
  return index;
}

export interface Session {
  label: string;
  startedAt: string;
  endedAt: string;
  hours: number;
}

/**
 * Collapses consecutive events that share the same dimension value into one session, bridging
 * gaps up to mergeGapMinutes. Programs are recorded per window change, so without this a single
 * hour in the editor looks like dozens of separate "sessions".
 */
export function toSessions(
  rows: OverviewFlatRowDto[],
  dimension: Dimension,
  mergeGapMinutes: number
): Session[] {
  const sorted = [...rows].sort(
    (a, b) => parseISO(a.startedAt).getTime() - parseISO(b.startedAt).getTime()
  );
  const gapMs = Math.max(0, mergeGapMinutes) * 60_000;
  const sessions: Session[] = [];

  for (const row of sorted) {
    const label = getDimensionValue(row, dimension);
    const previous = sessions.at(-1);
    if (
      previous &&
      previous.label === label &&
      parseISO(row.startedAt).getTime() - parseISO(previous.endedAt).getTime() <= gapMs
    ) {
      // Events can overlap slightly, so never let a merge shorten the session.
      if (row.endedAt > previous.endedAt) previous.endedAt = row.endedAt;
      previous.hours =
        (parseISO(previous.endedAt).getTime() - parseISO(previous.startedAt).getTime()) / 3_600_000;
      continue;
    }
    sessions.push({
      label,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      hours: row.durationHours,
    });
  }

  return sessions;
}

export type Interval = [number, number];

/** Merges overlapping/touching intervals, so overlapping timelines are not counted twice. */
export function unionIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  const merged: Interval[] = [];
  for (const [start, end] of sorted) {
    const previous = merged.at(-1);
    if (previous && start <= previous[1]) {
      previous[1] = Math.max(previous[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/** Overlapping parts of two already-unioned interval lists. */
export function intersectIntervals(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = [];
  let indexA = 0;
  let indexB = 0;
  while (indexA < a.length && indexB < b.length) {
    const start = Math.max(a[indexA][0], b[indexB][0]);
    const end = Math.min(a[indexA][1], b[indexB][1]);
    if (end > start) result.push([start, end]);
    if (a[indexA][1] < b[indexB][1]) indexA++;
    else indexB++;
  }
  return result;
}

export function rowsToIntervals(rows: OverviewFlatRowDto[]): Interval[] {
  return rows.map((row): Interval => [
    parseISO(row.startedAt).getTime(),
    parseISO(row.endedAt).getTime(),
  ]);
}
