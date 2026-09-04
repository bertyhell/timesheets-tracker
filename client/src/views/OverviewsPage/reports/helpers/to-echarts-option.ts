import type { EChartsCoreOption } from 'echarts/core';
import {
  ChartType,
  type CalendarReportResult,
  type MatrixReportResult,
  type ReportOptions,
  type ReportResult,
  type SeriesReportResult,
  type ValueUnit,
} from '../report.types';
import { formatAxisValue, formatValue } from './format-values';

// variables.css values, repeated here because ECharts paints on a canvas and cannot read them.
const GRAY_100 = '#e5e7eb';
const GRAY_500 = '#6b7280';
const GRAY_700 = '#374151';
const PRIMARY = '#7c3aed';
const PRIMARY_LIGHT = '#c4b5fd';

const BASE_TEXT_STYLE = {
  fontFamily: 'inherit',
  fontSize: 12,
  color: GRAY_700,
};

interface AxisTooltipParam {
  axisValueLabel: string;
  seriesName: string;
  value: number | null;
  marker: string;
}

function axisTooltip(unit: ValueUnit, showTotal: boolean) {
  return {
    trigger: 'axis' as const,
    axisPointer: { type: 'shadow' as const },
    textStyle: BASE_TEXT_STYLE,
    formatter: (params: AxisTooltipParam[] | AxisTooltipParam) => {
      const list = Array.isArray(params) ? params : [params];
      if (!list.length) return '';
      const lines = list
        .filter((param) => param.value !== null && param.value !== undefined && param.value !== 0)
        .map(
          (param) =>
            param.marker +
            ' ' +
            param.seriesName +
            ': <b>' +
            formatValue(param.value, unit) +
            '</b>'
        );
      if (showTotal && lines.length > 1) {
        const total = list.reduce((sum, param) => sum + (param.value ?? 0), 0);
        lines.push('<span style="color:' + GRAY_500 + '">Total: <b>' + formatValue(total, unit) + '</b></span>');
      }
      return '<b>' + list[0].axisValueLabel + '</b><br/>' + (lines.length ? lines.join('<br/>') : 'No data');
    },
  };
}

function categoryAxisLabel(categories: string[], horizontal: boolean) {
  if (horizontal) {
    return { width: 220, overflow: 'truncate' as const, color: GRAY_500 };
  }
  const rotate = categories.length > 8 ? 45 : 0;
  return {
    rotate,
    color: GRAY_500,
    hideOverlap: true,
    width: 110,
    overflow: 'truncate' as const,
  };
}

function valueAxis(unit: ValueUnit) {
  const base = {
    type: 'value' as const,
    axisLabel: { color: GRAY_500, formatter: (value: number) => formatAxisValue(value, unit) },
    splitLine: { lineStyle: { color: GRAY_100 } },
  };
  if (unit === 'timeOfDay') {
    return { ...base, min: 0, max: 24, interval: 3 };
  }
  return base;
}

function legendFor(result: SeriesReportResult) {
  if (result.series.length <= 1) return { show: false };
  return {
    show: true,
    type: 'scroll' as const,
    top: 0,
    textStyle: BASE_TEXT_STYLE,
    icon: 'roundRect',
  };
}

function dataZoomFor(result: SeriesReportResult) {
  // Long day-by-day ranges (a year of days) are unreadable without a zoom slider.
  if (!result.categoriesAreTimeBuckets || result.categories.length <= 45) return undefined;
  return [
    { type: 'inside' as const, start: 60, end: 100 },
    { type: 'slider' as const, start: 60, end: 100, height: 18, bottom: 16 },
  ];
}

/** Slices for the pie/treemap charts: per category when there is one series, else per series. */
function toParts(result: SeriesReportResult): { name: string; value: number; color?: string }[] {
  if (result.series.length === 1) {
    return result.categories.map((category, index) => ({
      name: category,
      value: result.series[0].data[index] ?? 0,
      color: result.categoryColors?.[index],
    }));
  }
  return result.series.map((series) => ({
    name: series.name,
    value: series.data.reduce((total: number, value) => total + (value ?? 0), 0),
    color: series.color,
  }));
}

function buildAxisChart(
  result: SeriesReportResult,
  options: ReportOptions,
  chartType: ChartType
): EChartsCoreOption {
  const horizontal = chartType === ChartType.BarHorizontal;
  const isLine = chartType === ChartType.Line || chartType === ChartType.Area;
  const stack =
    options.stacked && result.series.length > 1 && (chartType === ChartType.Bar || chartType === ChartType.Area)
      ? 'total'
      : undefined;

  const categoryAxis = {
    type: 'category' as const,
    data: result.categories,
    // Horizontal bars read top-down, so the first (biggest) category belongs at the top.
    inverse: horizontal,
    axisLabel: categoryAxisLabel(result.categories, horizontal),
    axisLine: { lineStyle: { color: GRAY_100 } },
    axisTick: { show: false },
  };

  const series = result.series.map((reportSeries) => ({
    name: reportSeries.name,
    type: isLine ? ('line' as const) : ('bar' as const),
    stack,
    smooth: false,
    connectNulls: false,
    symbol: result.categories.length > 60 ? 'none' : 'circle',
    symbolSize: 5,
    areaStyle: chartType === ChartType.Area ? { opacity: stack ? 0.85 : 0.25 } : undefined,
    lineStyle: isLine ? { width: 2 } : undefined,
    barMaxWidth: 44,
    itemStyle: {
      color: reportSeries.color ?? (result.series.length > 1 ? undefined : PRIMARY),
      borderRadius: isLine || stack ? 0 : horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0],
    },
    data:
      result.series.length === 1 && result.categoryColors
        ? reportSeries.data.map((value, index) => ({
            value,
            itemStyle: { color: result.categoryColors?.[index] ?? PRIMARY },
          }))
        : reportSeries.data,
  }));

  return {
    textStyle: BASE_TEXT_STYLE,
    grid: {
      left: 12,
      right: 24,
      top: result.series.length > 1 ? 34 : 12,
      // Leaves a margin below the (often rotated) category labels instead of letting them
      // run into the edge of the card.
      bottom: dataZoomFor(result) ? 48 : 18,
      containLabel: true,
    },
    tooltip: axisTooltip(result.valueUnit, !!stack),
    legend: legendFor(result),
    dataZoom: dataZoomFor(result),
    xAxis: horizontal ? valueAxis(result.valueUnit) : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis(result.valueUnit),
    series,
  };
}

function buildPieChart(result: SeriesReportResult, chartType: ChartType): EChartsCoreOption {
  const parts = toParts(result).filter((part) => part.value > 0);
  return {
    textStyle: BASE_TEXT_STYLE,
    tooltip: {
      trigger: 'item',
      textStyle: BASE_TEXT_STYLE,
      formatter: (param: { name: string; value: number; percent: number; marker: string }) =>
        param.marker +
        ' <b>' +
        param.name +
        '</b><br/>' +
        formatValue(param.value, result.valueUnit) +
        ' (' +
        param.percent +
        '%)',
    },
    legend: { show: false },
    series: [
      {
        type: 'pie',
        radius: chartType === ChartType.Donut ? ['45%', '72%'] : '72%',
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        minShowLabelAngle: 3,
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        label: {
          ...BASE_TEXT_STYLE,
          formatter: (param: { name: string; value: number }) =>
            param.name + '\n' + formatValue(param.value, result.valueUnit),
        },
        labelLine: { lineStyle: { color: GRAY_100 } },
        data: parts.map((part) => ({
          name: part.name,
          value: part.value,
          itemStyle: { color: part.color },
        })),
      },
    ],
  };
}

function buildTreemap(result: SeriesReportResult): EChartsCoreOption {
  const parts = toParts(result).filter((part) => part.value > 0);
  return {
    textStyle: BASE_TEXT_STYLE,
    tooltip: {
      trigger: 'item',
      textStyle: BASE_TEXT_STYLE,
      formatter: (param: { name: string; value: number }) =>
        '<b>' + param.name + '</b><br/>' + formatValue(param.value, result.valueUnit),
    },
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        width: '100%',
        height: '100%',
        itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
        label: {
          ...BASE_TEXT_STYLE,
          color: '#fff',
          formatter: (param: { name: string; value: number }) =>
            param.name + '\n' + formatValue(param.value, result.valueUnit),
        },
        data: parts.map((part) => ({
          name: part.name,
          value: part.value,
          itemStyle: { color: part.color },
        })),
      },
    ],
  };
}

function buildHeatmap(result: MatrixReportResult): EChartsCoreOption {
  const maxValue = result.cells.reduce((max, [, , value]) => Math.max(max, value), 0);
  return {
    textStyle: BASE_TEXT_STYLE,
    tooltip: {
      trigger: 'item',
      textStyle: BASE_TEXT_STYLE,
      formatter: (param: { value: [number, number, number] }) =>
        '<b>' +
        result.xLabels[param.value[0]] +
        ' ' +
        result.yLabels[param.value[1]] +
        '</b><br/>' +
        formatValue(param.value[2], result.valueUnit),
    },
    grid: { left: 12, right: 24, top: 24, bottom: 48, containLabel: true },
    xAxis: {
      type: 'category',
      position: 'top',
      data: result.xLabels,
      splitArea: { show: true },
      axisLabel: { color: GRAY_500, interval: 0 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: result.yLabels,
      // First row on top, so the hours read 00h → 23h downwards.
      inverse: true,
      splitArea: { show: true },
      axisLabel: { color: GRAY_500, interval: 0 },
      axisTick: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxValue || 1,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      itemHeight: 90,
      textStyle: BASE_TEXT_STYLE,
      formatter: (value: number) => formatAxisValue(value, result.valueUnit),
      inRange: { color: ['#f5f3ff', PRIMARY_LIGHT, PRIMARY, '#4c1d95'] },
    },
    series: [
      {
        type: 'heatmap',
        data: result.cells,
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        emphasis: { itemStyle: { borderColor: GRAY_700, borderWidth: 1 } },
      },
    ],
  };
}

function buildCalendar(result: CalendarReportResult): EChartsCoreOption {
  const maxValue = result.days.reduce((max, day) => Math.max(max, day.value), 0);
  // The year label would sit on top of the weekday header, so the year is folded into the
  // month labels instead, and only when the range actually crosses a year boundary.
  const spansMultipleYears = result.range[0].slice(0, 4) !== result.range[1].slice(0, 4);
  return {
    textStyle: BASE_TEXT_STYLE,
    tooltip: {
      trigger: 'item',
      textStyle: BASE_TEXT_STYLE,
      formatter: (param: { value: [string, number] }) =>
        '<b>' + param.value[0] + '</b><br/>' + formatValue(param.value[1], result.valueUnit),
    },
    visualMap: {
      min: 0,
      max: maxValue || 1,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      itemHeight: 90,
      textStyle: BASE_TEXT_STYLE,
      formatter: (value: number) => formatAxisValue(value, result.valueUnit),
      inRange: { color: ['#f5f3ff', PRIMARY_LIGHT, PRIMARY, '#4c1d95'] },
    },
    calendar: {
      // Vertical orientation puts the weekday labels across the top and stacks the months
      // downwards, which reads like a wall calendar.
      orient: 'vertical',
      top: 40,
      bottom: 60,
      left: 60,
      right: 20,
      cellSize: ['auto', 'auto'],
      range: result.range,
      splitLine: { lineStyle: { color: GRAY_100 } },
      itemStyle: { color: '#fff', borderColor: GRAY_100, borderWidth: 1 },
      yearLabel: { show: false },
      monthLabel: {
        color: GRAY_500,
        nameMap: 'en',
        formatter: (param: { nameMap: string; yyyy: string }) =>
          spansMultipleYears ? param.nameMap + ' ' + param.yyyy.slice(2) : param.nameMap,
      },
      dayLabel: { firstDay: 1, color: GRAY_500, nameMap: 'en' },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: result.days.map((day) => [day.date, day.value]),
      },
    ],
  };
}

export function toEChartsOption(result: ReportResult, options: ReportOptions): EChartsCoreOption {
  if (result.kind === 'matrix') return buildHeatmap(result);
  if (result.kind === 'calendar') return buildCalendar(result);

  switch (options.chartType) {
    case ChartType.Pie:
    case ChartType.Donut:
      return buildPieChart(result, options.chartType);
    case ChartType.Treemap:
      return buildTreemap(result);
    default:
      return buildAxisChart(result, options, options.chartType);
  }
}
