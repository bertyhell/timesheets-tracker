import {
  subYears,
  subMonths,
  subWeeks,
  subDays,
  startOfYear,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { DeleteEventsAfterUnit } from '../delete-events-after-unit.enum';

/**
 * "Calendar" units round the cutoff down to the start of that calendar period,
 * e.g. calendarYears(1) cuts off at Jan 1st of last year rather than exactly 365 days ago.
 */
export function computeDeleteEventsCutoff(
  numeric: number,
  unit: DeleteEventsAfterUnit,
  now: Date = new Date()
): Date {
  switch (unit) {
    case DeleteEventsAfterUnit.Years:
      return subYears(now, numeric);
    case DeleteEventsAfterUnit.CalendarYears:
      return startOfYear(subYears(now, numeric));
    case DeleteEventsAfterUnit.Months:
      return subMonths(now, numeric);
    case DeleteEventsAfterUnit.CalendarMonths:
      return startOfMonth(subMonths(now, numeric));
    case DeleteEventsAfterUnit.Weeks:
      return subWeeks(now, numeric);
    case DeleteEventsAfterUnit.CalendarWeeks:
      return startOfWeek(subWeeks(now, numeric));
    case DeleteEventsAfterUnit.Days:
      return subDays(now, numeric);
    default:
      throw new Error(`Unsupported delete-events-after unit: ${unit}`);
  }
}
