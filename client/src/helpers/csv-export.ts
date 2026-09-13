import { format as formatDate } from 'date-fns';

import { CsvColumnValue, CsvValueFormat, type CsvExportColumn } from '../types/types';
import { formatHours } from '../views/OverviewsPage/reports/helpers/format-values';
import type { TimelineEventDto } from '../generated/api/types.gen';

/** The tag fields the exporter reads off a timeline event, for both Tag and AutoTag timelines. */
interface TagEventInfoLike {
  tagNameId?: string;
  tagNameTitle?: string;
  tagNameName?: string;
  tagNameCode?: string | null;
  tagNameNote?: string | null;
  note?: string | null;
}

/** One line of the file: a single tag name on a single day, with its events collapsed. */
export interface CsvExportRow {
  tagNameId: string;
  tagName: string;
  tagCode: string;
  tagNote: string;
  notes: string[];
  /** Summed length of the collapsed events, in hours. */
  hours: number;
  /** Earliest start and latest end of the collapsed events, as ISO strings. */
  startedAt: string;
  endedAt: string;
  date: string;
  timelineName: string;
}

/**
 * Collapses a day's timeline events into one row per tag name.
 *
 * Hours are summed across the events rather than taken from start-to-end, so a tag picked up again
 * after lunch reports the time actually worked and not the gap. `startedAt`/`endedAt` stay the
 * outer bounds of the day, which is what a timesheet asks for.
 */
export function buildCsvRows(
  events: TimelineEventDto[],
  timelineName: string,
  date: string
): CsvExportRow[] {
  const rowsByTagName = new Map<string, CsvExportRow>();

  for (const event of events) {
    const info = event.info as TagEventInfoLike;
    if (!info?.tagNameId) continue;

    const startedAt = event.startedAt;
    const endedAt = event.endedAt;
    const hours = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 3_600_000;

    const existing = rowsByTagName.get(info.tagNameId);
    if (existing) {
      existing.hours += hours;
      if (startedAt < existing.startedAt) existing.startedAt = startedAt;
      if (endedAt > existing.endedAt) existing.endedAt = endedAt;
      // Same note twice says nothing twice, so only new ones are kept.
      if (info.note && !existing.notes.includes(info.note)) existing.notes.push(info.note);
      continue;
    }

    rowsByTagName.set(info.tagNameId, {
      tagNameId: info.tagNameId,
      tagName: info.tagNameTitle ?? info.tagNameName ?? '',
      tagCode: info.tagNameCode ?? '',
      tagNote: info.tagNameNote ?? '',
      notes: info.note ? [info.note] : [],
      hours,
      startedAt,
      endedAt,
      date,
      timelineName,
    });
  }

  return [...rowsByTagName.values()].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/**
 * The Productive sync stores a JSON mapping in the tag name's `code` column, which would be noise
 * in a spreadsheet — a code that parses as JSON is treated as "no code".
 */
function readableCode(code: string): string {
  if (!code.trim().startsWith('{')) return code;
  try {
    JSON.parse(code);
    return '';
  } catch {
    return code;
  }
}

function formatDuration(hours: number, valueFormat: CsvValueFormat | ''): string {
  const totalSeconds = Math.round(hours * 3600);
  const wholeHours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  switch (valueFormat) {
    case CsvValueFormat.DurationHoursMinutesSeconds:
      return `${pad(wholeHours)}:${pad(minutes)}:${pad(seconds)}`;
    case CsvValueFormat.DurationDecimalOne:
      return hours.toFixed(1);
    case CsvValueFormat.DurationDecimalTwo:
      return hours.toFixed(2);
    case CsvValueFormat.DurationMinutes:
      return String(Math.round(hours * 60));
    case CsvValueFormat.DurationHuman:
      return formatHours(hours);
    case CsvValueFormat.DurationHoursMinutes:
    default:
      // Seconds are dropped rather than truncated away, so 1h29m40s reads as 01:30 and a day of
      // rows still adds up to the day.
      return `${pad(Math.floor(Math.round(hours * 60) / 60))}:${pad(Math.round(hours * 60) % 60)}`;
  }
}

function formatTimeOfDay(iso: string, valueFormat: CsvValueFormat | ''): string {
  const date = new Date(iso);
  switch (valueFormat) {
    case CsvValueFormat.TimeHoursMinutesSeconds:
      return formatDate(date, 'HH:mm:ss');
    case CsvValueFormat.TimeDateAndHoursMinutes:
      return formatDate(date, 'yyyy-MM-dd HH:mm');
    case CsvValueFormat.TimeIso:
      return date.toISOString();
    case CsvValueFormat.TimeHoursMinutes:
    default:
      return formatDate(date, 'HH:mm');
  }
}

function formatDay(day: string, valueFormat: CsvValueFormat | ''): string {
  // `day` is a yyyy-MM-dd string; parsing it as local midnight keeps it on the same calendar day.
  const date = new Date(day + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return day;

  switch (valueFormat) {
    case CsvValueFormat.DateDayMonthYearSlash:
      return formatDate(date, 'dd/MM/yyyy');
    case CsvValueFormat.DateMonthDayYearSlash:
      return formatDate(date, 'MM/dd/yyyy');
    case CsvValueFormat.DateDayMonthYearDash:
      return formatDate(date, 'dd-MM-yyyy');
    case CsvValueFormat.DateWeekdayShort:
      return formatDate(date, 'EEE dd/MM/yyyy');
    case CsvValueFormat.DateWeekdayLong:
      return formatDate(date, 'EEEE dd/MM/yyyy');
    case CsvValueFormat.DateIso:
    default:
      return formatDate(date, 'yyyy-MM-dd');
  }
}

/** Renders one configured column for one row. */
export function formatCsvValue(row: CsvExportRow, column: CsvExportColumn): string {
  switch (column.value) {
    case CsvColumnValue.TagName:
      return row.tagName;
    case CsvColumnValue.TagCode:
      return readableCode(row.tagCode);
    case CsvColumnValue.TagNote:
      return row.tagNote;
    case CsvColumnValue.Notes:
      return row.notes.join('; ');
    case CsvColumnValue.Duration:
      return formatDuration(row.hours, column.format);
    case CsvColumnValue.Start:
      return formatTimeOfDay(row.startedAt, column.format);
    case CsvColumnValue.End:
      return formatTimeOfDay(row.endedAt, column.format);
    case CsvColumnValue.Date:
      return formatDay(row.date, column.format);
    case CsvColumnValue.TimelineName:
      return row.timelineName;
    case CsvColumnValue.StaticText:
      return column.staticText;
    default:
      return '';
  }
}

/** The whole grid, header row included when configured — what both the preview and the file show. */
export function buildCsvGrid(
  rows: CsvExportRow[],
  columns: CsvExportColumn[],
  includeHeader: boolean
): string[][] {
  const body = rows.map((row) => columns.map((column) => formatCsvValue(row, column)));
  return includeHeader ? [columns.map((column) => column.header), ...body] : body;
}
