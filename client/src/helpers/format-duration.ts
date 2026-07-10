export function formatDuration(seconds: number, rounding: 'round' | 'ceil' | 'floor' = 'ceil'): string {
  const totalMinutes = Math[rounding](seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours + ':' + String(minutes).padStart(2, '0');
}
