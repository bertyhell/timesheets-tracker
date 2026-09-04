import { ChartType, type ReportOptions, type ReportResult } from '../report.types';

/** Below this a chart is unreadable no matter how little room is left. */
const MIN_CHART_HEIGHT = 240;

/**
 * Some charts need a row per category and get cramped when squeezed: a vertical calendar has a
 * row per week, a heatmap a row per hour, and horizontal bars a row per category. Those ask for
 * a minimum height, but never more than the room the view actually has, so the page fits on the
 * screen instead of growing a vertical scrollbar. Only when the room left is unusably small
 * (a very short window) does the chart keep its floor and the view scroll.
 */
export function getPreferredChartHeight(
  result: ReportResult,
  options: ReportOptions,
  availableHeight?: number
): number | undefined {
  const preferred = getIdealChartHeight(result, options);
  if (preferred === undefined) return undefined;
  if (availableHeight === undefined) return preferred;
  return Math.max(MIN_CHART_HEIGHT, Math.min(preferred, availableHeight));
}

function getIdealChartHeight(result: ReportResult, options: ReportOptions): number | undefined {
  if (result.kind === 'calendar') {
    const weeks = Math.ceil(result.days.length / 7) + 1;
    return weeks * 32 + 150;
  }

  if (result.kind === 'matrix') {
    return result.yLabels.length * 24 + 130;
  }

  if (options.chartType === ChartType.BarHorizontal) {
    return result.categories.length * 28 + 90;
  }

  return undefined;
}
