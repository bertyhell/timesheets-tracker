import './ReportSummary.css';
import React from 'react';
import type { ReportResult } from '../report.types';
import { formatValue } from '../helpers/format-values';

interface Tile {
  label: string;
  value: string;
  hint?: string;
}

function buildTiles(result: ReportResult): Tile[] {
  if (result.kind === 'calendar') {
    const withData = result.days.filter((day) => day.value > 0);
    const total = withData.reduce((sum, day) => sum + day.value, 0);
    const best = withData.reduce<{ date: string; value: number } | null>(
      (max, day) => (!max || day.value > max.value ? day : max),
      null
    );
    return [
      { label: 'Total', value: formatValue(total, result.valueUnit) },
      { label: 'Days with data', value: String(withData.length) },
      {
        label: 'Average per active day',
        value: withData.length ? formatValue(total / withData.length, result.valueUnit) : '–',
      },
      best
        ? { label: 'Busiest day', value: formatValue(best.value, result.valueUnit), hint: best.date }
        : { label: 'Busiest day', value: '–' },
    ];
  }

  if (result.kind === 'matrix') {
    const total = result.cells.reduce((sum, [, , value]) => sum + value, 0);
    const busiest = result.cells.reduce<[number, number, number] | null>(
      (max, cell) => (!max || cell[2] > max[2] ? cell : max),
      null
    );
    return [
      { label: 'Total', value: formatValue(total, result.valueUnit) },
      { label: 'Filled slots', value: String(result.cells.length) },
      busiest
        ? {
            label: 'Busiest slot',
            value: formatValue(busiest[2], result.valueUnit),
            hint: result.yLabels[busiest[1]] + ' ' + result.xLabels[busiest[0]],
          }
        : { label: 'Busiest slot', value: '–' },
    ];
  }

  const perCategory = result.categories.map((category, index) => ({
    category,
    value: result.series.reduce((sum, series) => sum + (series.data[index] ?? 0), 0),
  }));
  const nonEmpty = perCategory.filter((entry) => entry.value > 0);
  const total = perCategory.reduce((sum, entry) => sum + entry.value, 0);
  const biggest = nonEmpty.reduce<{ category: string; value: number } | null>(
    (max, entry) => (!max || entry.value > max.value ? entry : max),
    null
  );

  // Summing clock times would be meaningless, so those reports only get their extremes.
  if (result.valueUnit === 'timeOfDay') {
    const earliest = Math.min(
      ...(result.series[0]?.data.filter((value): value is number => value !== null) ?? [24])
    );
    const latest = Math.max(
      ...(result.series[1]?.data.filter((value): value is number => value !== null) ?? [0])
    );
    const spans = result.categories
      .map((_, index) => {
        const start = result.series[0]?.data[index];
        const end = result.series[1]?.data[index];
        return start !== null && start !== undefined && end !== null && end !== undefined
          ? end - start
          : null;
      })
      .filter((span): span is number => span !== null);
    return [
      { label: 'Days with data', value: String(spans.length) },
      { label: 'Earliest start', value: nonEmpty.length ? formatValue(earliest, 'timeOfDay') : '–' },
      { label: 'Latest end', value: spans.length ? formatValue(latest, 'timeOfDay') : '–' },
      {
        label: 'Average span',
        value: spans.length
          ? formatValue(spans.reduce((sum, span) => sum + span, 0) / spans.length, 'hours')
          : '–',
      },
    ];
  }

  // The category label is used as a hint rather than pluralised into the label, because
  // "Hour of days" / "Sessions per session" read badly for some reports.
  return [
    { label: 'Total', value: formatValue(total, result.valueUnit) },
    {
      label: 'With data',
      value: String(nonEmpty.length),
      hint: result.categoryLabel.toLowerCase(),
    },
    {
      label: 'Average',
      value: nonEmpty.length ? formatValue(total / nonEmpty.length, result.valueUnit) : '–',
      hint: 'per ' + result.categoryLabel.toLowerCase(),
    },
    biggest
      ? {
          label: 'Biggest',
          value: formatValue(biggest.value, result.valueUnit),
          hint: biggest.category,
        }
      : { label: 'Biggest', value: '–' },
  ];
}

export function ReportSummary({ result }: { result: ReportResult }) {
  const tiles = buildTiles(result);
  return (
    <div className="c-report-summary">
      {tiles.map((tile) => (
        <div key={tile.label} className="c-report-summary__tile">
          <span className="c-report-summary__label">{tile.label}</span>
          <span className="c-report-summary__value">{tile.value}</span>
          {tile.hint && (
            <span className="c-report-summary__hint" title={tile.hint}>
              {tile.hint}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
