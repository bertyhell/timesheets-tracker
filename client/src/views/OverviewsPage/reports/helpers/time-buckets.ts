import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { TimeBucket } from '../report.types';

const MS_PER_HOUR = 3_600_000;

export interface TimeSlice {
  /** Bucket key: 'yyyy-MM-dd', 'RRRR-Www' or 'yyyy-MM'. */
  key: string;
  hours: number;
}

export function getBucketKey(date: Date, bucket: TimeBucket): string {
  switch (bucket) {
    case TimeBucket.Day:
      return format(date, 'yyyy-MM-dd');
    case TimeBucket.Week:
      return format(date, "RRRR-'W'II");
    case TimeBucket.Month:
      return format(date, 'yyyy-MM');
  }
}

function startOfBucket(date: Date, bucket: TimeBucket): Date {
  switch (bucket) {
    case TimeBucket.Day:
      return startOfDay(date);
    case TimeBucket.Week:
      return startOfWeek(date, { weekStartsOn: 1 });
    case TimeBucket.Month:
      return startOfMonth(date);
  }
}

function nextBucketStart(date: Date, bucket: TimeBucket): Date {
  switch (bucket) {
    case TimeBucket.Day:
      return addDays(startOfDay(date), 1);
    case TimeBucket.Week:
      return addDays(startOfWeek(date, { weekStartsOn: 1 }), 7);
    case TimeBucket.Month:
      return addMonths(startOfMonth(date), 1);
  }
}

/**
 * Splits an event across the buckets it spans, so an event running past midnight contributes its
 * real share to each day instead of landing entirely in the day it started.
 */
export function splitIntervalByBucket(
  startedAt: string,
  endedAt: string,
  bucket: TimeBucket
): TimeSlice[] {
  const start = parseISO(startedAt);
  const end = parseISO(endedAt);
  if (!(end > start)) return [];

  const slices: TimeSlice[] = [];
  let cursor = start;
  while (cursor < end) {
    const boundary = nextBucketStart(cursor, bucket);
    const sliceEnd = boundary < end ? boundary : end;
    slices.push({
      key: getBucketKey(cursor, bucket),
      hours: (sliceEnd.getTime() - cursor.getTime()) / MS_PER_HOUR,
    });
    cursor = sliceEnd;
  }
  return slices;
}

export interface HourSlice {
  /** Hour of the day, 0–23. */
  hour: number;
  /** Day of the week, 0 = Monday … 6 = Sunday. */
  weekdayIndex: number;
  hours: number;
}

/** Same idea as splitIntervalByBucket, but per clock hour, for the hour-of-day reports. */
export function splitIntervalByHour(startedAt: string, endedAt: string): HourSlice[] {
  const start = parseISO(startedAt);
  const end = parseISO(endedAt);
  if (!(end > start)) return [];

  const slices: HourSlice[] = [];
  let cursor = start;
  while (cursor < end) {
    const boundary = new Date(cursor);
    boundary.setMinutes(0, 0, 0);
    boundary.setHours(boundary.getHours() + 1);
    const sliceEnd = boundary < end ? boundary : end;
    slices.push({
      hour: cursor.getHours(),
      weekdayIndex: (cursor.getDay() + 6) % 7,
      hours: (sliceEnd.getTime() - cursor.getTime()) / MS_PER_HOUR,
    });
    cursor = sliceEnd;
  }
  return slices;
}

/** Every bucket in the range, so buckets without any data still show up as a zero/gap. */
export function enumerateBuckets(startedAt: string, endedAt: string, bucket: TimeBucket): string[] {
  const start = startOfBucket(parseISO(startedAt), bucket);
  const end = parseISO(endedAt);
  const keys: string[] = [];
  let cursor = start;
  // Guard against a pathological range (eg. "this year" per day is 365 buckets, fine, but a
  // corrupted custom range should not spin forever).
  while (cursor <= end && keys.length < 1500) {
    keys.push(getBucketKey(cursor, bucket));
    cursor = nextBucketStart(cursor, bucket);
  }
  return keys;
}

export function enumerateDays(startedAt: string, endedAt: string): string[] {
  const start = startOfDay(parseISO(startedAt));
  const end = endOfDay(parseISO(endedAt));
  if (!(end > start)) return [];
  return eachDayOfInterval({ start, end }).map((day) => format(day, 'yyyy-MM-dd'));
}

export function formatBucketLabel(key: string, bucket: TimeBucket): string {
  switch (bucket) {
    case TimeBucket.Day: {
      const parsed = parseISO(key);
      return format(parsed, 'EEE d MMM');
    }
    case TimeBucket.Week:
      return key.replace('-W', ' · week ');
    case TimeBucket.Month:
      return format(parseISO(key + '-01'), 'MMM yyyy');
  }
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, '0') + 'h'
);
