import type { ValueUnit } from '../report.types';

/** "7h 30m" / "45m" — the way durations are shown everywhere else in the app. */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!wholeHours) return minutes + 'm';
  if (!minutes) return wholeHours + 'h';
  return wholeHours + 'h ' + String(minutes).padStart(2, '0') + 'm';
}

/** A fractional hour-of-day (9.5) as a clock time ("09:30"). */
export function formatTimeOfDay(hours: number): string {
  const clamped = Math.max(0, Math.min(24, hours));
  const wholeHours = Math.floor(clamped);
  const minutes = Math.round((clamped - wholeHours) * 60);
  if (minutes === 60) return String(wholeHours + 1).padStart(2, '0') + ':00';
  return String(wholeHours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

export function formatValue(value: number | null | undefined, unit: ValueUnit): string {
  if (value === null || value === undefined) return '–';
  switch (unit) {
    case 'hours':
      return formatHours(value);
    case 'timeOfDay':
      return formatTimeOfDay(value);
    case 'count':
      return String(Math.round(value));
  }
}

/** Shorter variant for axis ticks, where "7h 30m" is too wide. */
export function formatAxisValue(value: number, unit: ValueUnit): string {
  switch (unit) {
    case 'hours':
      return value >= 1 || value === 0
        ? Number(value.toFixed(value < 10 ? 1 : 0)) + 'h'
        : Math.round(value * 60) + 'm';
    case 'timeOfDay':
      return formatTimeOfDay(value);
    case 'count':
      return String(Math.round(value));
  }
}
