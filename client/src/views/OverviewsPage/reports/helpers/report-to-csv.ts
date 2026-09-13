import type { ReportResult } from '../report.types';
import { formatValue } from './format-values';
import { toCsv } from '../../../../helpers/csv';

// The CSV primitives moved to helpers/csv.ts when the Excel CSV integration needed them too.
// Re-exported here so the Overviews page keeps importing its export helpers from one place.
export { downloadCsv, downloadDataUrl } from '../../../../helpers/csv';

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
