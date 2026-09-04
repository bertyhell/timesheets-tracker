import './ReportTable.css';
import React from 'react';
import type { ReportResult } from '../report.types';
import { formatValue } from '../helpers/format-values';

interface ReportTableProps {
  result: ReportResult;
}

/** The "Table" chart type: the exact numbers behind the chart, and what the CSV export holds. */
export function ReportTable({ result }: ReportTableProps) {
  if (result.kind === 'series') {
    const totals = result.series.map((series) =>
      series.data.reduce((total: number, value) => total + (value ?? 0), 0)
    );
    return (
      <div className="c-report-table">
        <table>
          <thead>
            <tr>
              <th>{result.categoryLabel}</th>
              {result.series.map((series) => (
                <th key={series.name} className="is-numeric">
                  {series.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.categories.map((category, index) => (
              <tr key={category + index}>
                <td title={category}>{category}</td>
                {result.series.map((series) => (
                  <td key={series.name} className="is-numeric">
                    {formatValue(series.data[index], result.valueUnit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {result.valueUnit !== 'timeOfDay' && (
            <tfoot>
              <tr>
                <td>Total</td>
                {totals.map((total, index) => (
                  <td key={index} className="is-numeric">
                    {formatValue(total, result.valueUnit)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }

  if (result.kind === 'matrix') {
    const valueAt = new Map(result.cells.map(([x, y, value]) => [x + '|' + y, value]));
    return (
      <div className="c-report-table">
        <table>
          <thead>
            <tr>
              <th />
              {result.xLabels.map((xLabel) => (
                <th key={xLabel} className="is-numeric">
                  {xLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.yLabels.map((yLabel, yIndex) => (
              <tr key={yLabel}>
                <td>{yLabel}</td>
                {result.xLabels.map((xLabel, xIndex) => (
                  <td key={xLabel} className="is-numeric">
                    {formatValue(valueAt.get(xIndex + '|' + yIndex) ?? 0, result.valueUnit)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="c-report-table">
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th className="is-numeric">Tracked</th>
          </tr>
        </thead>
        <tbody>
          {result.days.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td className="is-numeric">{formatValue(day.value, result.valueUnit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
