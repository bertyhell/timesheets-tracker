import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
} from 'date-fns';
import { DateRangeMode } from '../types/types';

export interface DateRange {
  startedAt: string;
  endedAt: string;
}

export function resolveDateRange(
  mode: DateRangeMode,
  customStartedAt?: string | null,
  customEndedAt?: string | null
): DateRange {
  const now = new Date();

  switch (mode) {
    case DateRangeMode.Today:
      return { startedAt: startOfDay(now).toISOString(), endedAt: endOfDay(now).toISOString() };
    case DateRangeMode.ThisWeek:
      return {
        startedAt: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        endedAt: endOfWeek(now, { weekStartsOn: 1 }).toISOString(),
      };
    case DateRangeMode.ThisMonth:
      return { startedAt: startOfMonth(now).toISOString(), endedAt: endOfMonth(now).toISOString() };
    case DateRangeMode.ThisYear:
      return { startedAt: startOfYear(now).toISOString(), endedAt: endOfYear(now).toISOString() };
    case DateRangeMode.Last7Days:
      return { startedAt: startOfDay(subDays(now, 6)).toISOString(), endedAt: endOfDay(now).toISOString() };
    case DateRangeMode.Last30Days:
      return { startedAt: startOfDay(subDays(now, 29)).toISOString(), endedAt: endOfDay(now).toISOString() };
    case DateRangeMode.Last90Days:
      return { startedAt: startOfDay(subDays(now, 89)).toISOString(), endedAt: endOfDay(now).toISOString() };
    case DateRangeMode.Last365Days:
      return { startedAt: startOfDay(subDays(now, 364)).toISOString(), endedAt: endOfDay(now).toISOString() };
    case DateRangeMode.Custom:
      return {
        startedAt: customStartedAt ? startOfDay(new Date(customStartedAt)).toISOString() : startOfDay(now).toISOString(),
        endedAt: customEndedAt ? endOfDay(new Date(customEndedAt)).toISOString() : endOfDay(now).toISOString(),
      };
  }
}
