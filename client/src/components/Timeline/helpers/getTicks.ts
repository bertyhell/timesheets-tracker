import { addMinutes, isBefore } from 'date-fns';

const NICE_INTERVALS_MINUTES = [1, 2, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 480, 720, 1440];

/**
 * Returns tick dates aligned to a grid.
 * If intervalMinutes is provided it is used directly; otherwise an interval is
 * chosen automatically to produce roughly 8 evenly-spaced labels.
 */
export function getTicks(minTime: Date, maxTime: Date, intervalMinutes?: number): Date[] {
  const windowMinutes = (maxTime.getTime() - minTime.getTime()) / 60_000;

  const interval =
    intervalMinutes ??
    NICE_INTERVALS_MINUTES.find((i) => i >= windowMinutes / 8) ??
    NICE_INTERVALS_MINUTES.at(-1)!;

  const ticks: Date[] = [];
  const dayStart = new Date(
    minTime.getFullYear(),
    minTime.getMonth(),
    minTime.getDate(),
    0,
    0,
    0,
    0
  );
  const msSinceMidnight = minTime.getTime() - dayStart.getTime();
  const intervalMs = interval * 60_000;
  const firstTickMinutes = Math.ceil(msSinceMidnight / intervalMs) * interval;

  let nextTick = addMinutes(dayStart, firstTickMinutes);

  while (isBefore(nextTick, maxTime)) {
    ticks.push(new Date(nextTick));
    nextTick = addMinutes(nextTick, interval);
  }

  return ticks;
}
