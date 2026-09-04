import type { ReportResult } from '../report.types';
import { formatValue } from './format-values';

function escapeCell(value: string): string {
  return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\n');
}

/**
 * Exports exactly what the chart shows, formatted the same way, so the CSV can be pasted into a
 * timesheet without re-deriving anything.
 */
export function reportToCsv(result: ReportResult): string {
  if (result.kind === 'series') {
    const header = [result.categoryLabel, ...result.series.map((series) => series.name)];
    const rows = result.categories.map((category, index) => [
      category,
      ...result.series.map((series) => formatValue(series.data[index], result.valueUnit)),
    ]);
    return toCsv([header, ...rows]);
  }

  if (result.kind === 'matrix') {
    const header = ['', ...result.xLabels];
    const valueAt = new Map(result.cells.map(([x, y, value]) => [x + '|' + y, value]));
    const rows = result.yLabels.map((yLabel, yIndex) => [
      yLabel,
      ...result.xLabels.map((_, xIndex) =>
        formatValue(valueAt.get(xIndex + '|' + yIndex) ?? 0, result.valueUnit)
      ),
    ]);
    return toCsv([header, ...rows]);
  }

  return toCsv([
    ['Date', 'Value'],
    ...result.days.map((day) => [day.date, formatValue(day.value, result.valueUnit)]),
  ]);
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.png';
  link.click();
}
