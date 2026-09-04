import './ReportOptionsBar.css';
import React from 'react';
import {
  AreaChart,
  BarChart3,
  BarChartHorizontal,
  CalendarDays,
  CircleDot,
  Grid3x3,
  LayoutGrid,
  LineChart,
  PieChart,
  Table2,
  type LucideIcon,
} from 'lucide-react';
import { Dropdown } from '../../../../components/Dropdown/Dropdown';
import {
  ChartType,
  type ReportDefinition,
  type ReportOptions,
  SortMode,
  SPLIT_NONE,
} from '../report.types';
import {
  BUCKET_LABELS,
  CHART_TYPE_LABELS,
  MERGE_GAP_OPTIONS,
  METRIC_LABELS,
  MIN_DURATION_OPTIONS,
  SORT_LABELS,
  TOP_N_OPTIONS,
} from '../helpers/report-state';

const CHART_TYPE_ICONS: Record<ChartType, LucideIcon> = {
  [ChartType.Bar]: BarChart3,
  [ChartType.BarHorizontal]: BarChartHorizontal,
  [ChartType.Line]: LineChart,
  [ChartType.Area]: AreaChart,
  [ChartType.Pie]: PieChart,
  [ChartType.Donut]: CircleDot,
  [ChartType.Treemap]: LayoutGrid,
  [ChartType.Heatmap]: Grid3x3,
  [ChartType.Calendar]: CalendarDays,
  [ChartType.Table]: Table2,
};

interface OptionSelectProps<T> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function OptionSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: OptionSelectProps<T>) {
  const selected = options.find((option) => option.value === value);
  return (
    <label className="c-report-option">
      <span className="c-report-option__label">{label}</span>
      <Dropdown label={selected?.label ?? '–'} className="c-report-option__dropdown">
        {(close) => (
          <div className="c-report-option__panel">
            {options.map((option) => (
              <button
                key={String(option.value)}
                className={
                  'c-report-option__item' + (option.value === value ? ' is-active' : '')
                }
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </Dropdown>
    </label>
  );
}

interface ReportOptionsBarProps {
  report: ReportDefinition;
  options: ReportOptions;
  onChange: (options: Partial<ReportOptions>) => void;
  /** Stacking only means something once the chart actually draws several series. */
  canStack: boolean;
}

export function ReportOptionsBar({
  report,
  options,
  onChange,
  canStack,
}: ReportOptionsBarProps) {
  const { optionSpec } = report;
  // With a single series the limit would have nothing to trim: it only caps how many series a
  // "split by" breakdown draws, or how many categories a distribution chart shows.
  const showTopN = optionSpec.topN && !(optionSpec.splitBy && options.splitBy === SPLIT_NONE);

  return (
    <div className="c-report-options">
      <div className="c-report-options__chart-types" role="group" aria-label="Chart type">
        {report.chartTypes.map((chartType) => {
          const Icon = CHART_TYPE_ICONS[chartType];
          return (
            <button
              key={chartType}
              type="button"
              title={CHART_TYPE_LABELS[chartType]}
              aria-label={CHART_TYPE_LABELS[chartType]}
              aria-pressed={options.chartType === chartType}
              className={
                'c-report-options__chart-type' +
                (options.chartType === chartType ? ' is-active' : '')
              }
              onClick={() => onChange({ chartType })}
            >
              <Icon size={15} />
            </button>
          );
        })}
      </div>

      <div className="c-report-options__selects">
        {!!optionSpec.metric?.length && optionSpec.metric.length > 1 && (
          <OptionSelect
            label="Show"
            value={options.metric}
            options={optionSpec.metric.map((metric) => ({
              value: metric,
              label: METRIC_LABELS[metric],
            }))}
            onChange={(metric) => onChange({ metric })}
          />
        )}

        {!!optionSpec.dimension?.length && optionSpec.dimension.length > 1 && (
          <OptionSelect
            label={optionSpec.dimensionLabel ?? 'Group by'}
            value={options.dimension}
            options={optionSpec.dimension}
            onChange={(dimension) => onChange({ dimension })}
          />
        )}

        {!!optionSpec.splitBy?.length && (
          <OptionSelect
            label="Split by"
            value={options.splitBy}
            options={optionSpec.splitBy}
            onChange={(splitBy) => onChange({ splitBy })}
          />
        )}

        {!!optionSpec.bucket?.length && optionSpec.bucket.length > 1 && (
          <OptionSelect
            label="Bucket"
            value={options.bucket}
            options={optionSpec.bucket.map((bucket) => ({
              value: bucket,
              label: BUCKET_LABELS[bucket],
            }))}
            onChange={(bucket) => onChange({ bucket })}
          />
        )}

        {showTopN && (
          <OptionSelect
            label={optionSpec.topNLabel ?? 'Limit'}
            value={options.topN}
            options={TOP_N_OPTIONS}
            onChange={(topN) => onChange({ topN })}
          />
        )}

        {optionSpec.sort && (
          <OptionSelect
            label="Sort"
            value={options.sort}
            options={Object.values(SortMode).map((sort) => ({ value: sort, label: SORT_LABELS[sort] }))}
            onChange={(sort) => onChange({ sort })}
          />
        )}

        {optionSpec.mergeGap && (
          <OptionSelect
            label="Sessions"
            value={options.mergeGapMinutes}
            options={MERGE_GAP_OPTIONS}
            onChange={(mergeGapMinutes) => onChange({ mergeGapMinutes })}
          />
        )}

        {optionSpec.minDuration && (
          <OptionSelect
            label="Noise"
            value={options.minDurationSeconds}
            options={MIN_DURATION_OPTIONS}
            onChange={(minDurationSeconds) => onChange({ minDurationSeconds })}
          />
        )}

        {canStack && (
          <label className="c-report-option c-report-option--check">
            <input
              type="checkbox"
              checked={options.stacked}
              onChange={(event) => onChange({ stacked: event.target.checked })}
            />
            <span>Stacked</span>
          </label>
        )}
      </div>
    </div>
  );
}
