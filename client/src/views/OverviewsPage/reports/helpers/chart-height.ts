import { ChartType, type ReportOptions, type ReportResult } from '../report.types';

/**
 * Some charts need a row per category and get unreadable when squeezed into the available
 * height: a vertical calendar has a row per week, a heatmap a row per hour, and horizontal bars
 * a row per category. Those get a minimum height and the view scrolls instead of shrinking them.
 */
export function getPreferredChartHeight(
  result: ReportResult,
  options: ReportOptions
): number | undefined {
  if (result.kind === 'calendar') {
    const weeks = Math.ceil(result.days.length / 7) + 1;
    return Math.min(2400, weeks * 32 + 150);
  }

  if (result.kind === 'matrix') {
    return Math.min(1200, result.yLabels.length * 24 + 130);
  }

  if (options.chartType === ChartType.BarHorizontal) {
    return Math.min(1600, result.categories.length * 28 + 90);
  }

  return undefined;
}
