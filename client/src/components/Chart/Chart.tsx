import './Chart.css';
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, HeatmapChart, LineChart, PieChart, TreemapChart } from 'echarts/charts';
import {
  CalendarComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Only the pieces the reports actually draw are registered, so the rest of ECharts
// (maps, 3d, gl, graph/sankey/gauge/radar, ...) is tree-shaken out of the bundle.
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TreemapChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  CalendarComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

interface ChartProps {
  option: echarts.EChartsCoreOption;
  className?: string;
  /** Receives the live chart instance, so callers can export it as an image. */
  onInstance?: (instance: echarts.ECharts | null) => void;
}

export function Chart({ option, className, onInstance }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  // Kept in a ref so a caller that passes an inline callback does not re-init the chart.
  const onInstanceRef = useRef(onInstance);
  onInstanceRef.current = onInstance;

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    onInstanceRef.current?.(chart);

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
      onInstanceRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    // notMerge, because switching report or chart type replaces the option wholesale and
    // leftovers from the previous option (axes, visualMap, ...) would otherwise be kept.
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={containerRef} className={`c-chart${className ? ' ' + className : ''}`} />;
}
