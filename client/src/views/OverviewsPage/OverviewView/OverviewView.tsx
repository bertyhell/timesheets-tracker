import './OverviewView.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import type * as echarts from 'echarts/core';
import { toast } from 'react-toastify';
import { Copy, Download, Image, Pencil, Save } from 'lucide-react';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { Chart } from '../../../components/Chart/Chart';
import { DateRangeSelect } from '../../../components/DateRangeSelect/DateRangeSelect';
import { ROUTE_PARTS } from '../../../App';
import { headerActionsAtom } from '../../../store/store';
import { DateRangeMode } from '../../../types/types';
import { overviewsApi } from '../../../api/overviews';
import { resolveDateRange } from '../helpers/resolveDateRange';
import { ChartType, type ReportOptions } from '../reports/report.types';
import { DEFAULT_REPORT_ID, findReport, REPORTS } from '../reports/report-catalog';
import { resolveReportOptions, toReportState } from '../reports/helpers/report-state';
import { toEChartsOption } from '../reports/helpers/to-echarts-option';
import { downloadCsv, downloadDataUrl, reportToCsv } from '../reports/helpers/report-to-csv';
import { ReportOptionsBar } from '../reports/components/ReportOptionsBar';
import { ReportSummary } from '../reports/components/ReportSummary';
import { ReportTable } from '../reports/components/ReportTable';

export function OverviewView() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const setHeaderActions = useSetAtom(headerActionsAtom);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // A route param is either a report id from the catalog or the id of a saved custom overview.
  const predefinedReport = useMemo(() => findReport(configId), [configId]);
  const isCustom = !predefinedReport;

  const { data: customConfig } = useQuery({
    queryKey: ['overview', configId],
    queryFn: () => overviewsApi.findOne(configId as string),
    enabled: isCustom && !!configId,
  });

  const [reportId, setReportId] = useState<string>(predefinedReport?.id ?? DEFAULT_REPORT_ID);
  const [options, setOptions] = useState<ReportOptions>(() =>
    resolveReportOptions(predefinedReport ?? REPORTS[0], undefined)
  );
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(
    predefinedReport?.defaultDateRangeMode ?? DateRangeMode.ThisWeek
  );
  const [customStartedAt, setCustomStartedAt] = useState<string | undefined>();
  const [customEndedAt, setCustomEndedAt] = useState<string | undefined>();

  const report = findReport(reportId) ?? REPORTS[0];

  // Reset the view whenever another report or saved overview is opened.
  useEffect(() => {
    if (predefinedReport) {
      setReportId(predefinedReport.id);
      setOptions(resolveReportOptions(predefinedReport, undefined));
      setDateRangeMode(predefinedReport.defaultDateRangeMode);
      setCustomStartedAt(undefined);
      setCustomEndedAt(undefined);
      return;
    }
    if (!customConfig) return;

    const savedReport = findReport(customConfig.reportState?.reportId) ?? REPORTS[0];
    setReportId(savedReport.id);
    setOptions(resolveReportOptions(savedReport, customConfig.reportState?.options));
    setDateRangeMode(customConfig.dateRangeMode);
    setCustomStartedAt(customConfig.customStartedAt ?? undefined);
    setCustomEndedAt(customConfig.customEndedAt ?? undefined);
  }, [predefinedReport, customConfig]);

  const { startedAt, endedAt } = resolveDateRange(dateRangeMode, customStartedAt, customEndedAt);
  const sourceTypes = useMemo(() => report.sourceTypes(options), [report, options]);

  const {
    data: flatRows,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['overview-data', startedAt, endedAt, sourceTypes],
    queryFn: () => overviewsApi.getData(startedAt, endedAt, sourceTypes),
    enabled: sourceTypes.length > 0,
    placeholderData: (previous) => previous,
  });

  const result = useMemo(
    () => report.compute({ rows: flatRows ?? [], options, startedAt, endedAt }),
    [report, flatRows, options, startedAt, endedAt]
  );

  const chartOption = useMemo(() => toEChartsOption(result, options), [result, options]);

  const hasData =
    result.kind === 'series'
      ? result.series.some((series) => series.data.some((value) => (value ?? 0) !== 0))
      : result.kind === 'matrix'
        ? result.cells.length > 0
        : result.days.some((day) => day.value > 0);

  const canStack =
    result.kind === 'series' &&
    result.series.length > 1 &&
    (options.chartType === ChartType.Bar || options.chartType === ChartType.Area);

  const handleOptionsChange = (patch: Partial<ReportOptions>) => {
    setOptions((previous) => ({ ...previous, ...patch }));
  };

  const handleDateRangeChange = (mode: DateRangeMode, newStart?: string, newEnd?: string) => {
    setDateRangeMode(mode);
    setCustomStartedAt(newStart);
    setCustomEndedAt(newEnd);
  };

  const title = isCustom ? (customConfig?.name ?? report.label) : report.label;

  const handleExportCsv = () => downloadCsv(reportToCsv(result), title);

  const handleExportPng = () => {
    const dataUrl = chartInstanceRef.current?.getDataURL({
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });
    if (!dataUrl) {
      toast('Switch to a chart view to export an image', { type: 'info' });
      return;
    }
    downloadDataUrl(dataUrl, title);
  };

  const handleSave = async () => {
    if (!configId || !isCustom) return;
    await overviewsApi.update(configId, {
      reportState: toReportState(report, options),
      dateRangeMode,
      customStartedAt,
      customEndedAt,
      sourceTypes,
    });
    toast('Overview saved', { type: 'success' });
  };

  const handleSaveAsNew = () => {
    navigate('/' + ROUTE_PARTS.overviews + '/' + ROUTE_PARTS.new, {
      state: {
        reportState: toReportState(report, options),
        dateRangeMode,
        customStartedAt,
        customEndedAt,
        sourceTypes,
      },
    });
  };

  // The filters and actions live in the page's top bar, which OverviewsPage owns.
  useEffect(() => {
    setHeaderActions(
      <>
        <div className="m-overview-view__filters">
          <span className="m-overview-view__filters-label">Range</span>
          <DateRangeSelect
            mode={dateRangeMode}
            customStartedAt={customStartedAt}
            customEndedAt={customEndedAt}
            onChange={handleDateRangeChange}
          />
        </div>

        <div className="m-overview-view__actions">
          <Button variant={ButtonVariant.Secondary} onClick={handleExportCsv}>
            <Download size={14} /> CSV
          </Button>
          <Button variant={ButtonVariant.Secondary} onClick={handleExportPng}>
            <Image size={14} /> PNG
          </Button>
          {isCustom && (
            <Button variant={ButtonVariant.Secondary} onClick={handleSave}>
              <Save size={14} /> Save
            </Button>
          )}
          <Button variant={ButtonVariant.Secondary} onClick={handleSaveAsNew}>
            <Copy size={14} /> Save as new
          </Button>
          {isCustom && (
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() =>
                navigate('/' + ROUTE_PARTS.overviews + '/' + configId + '/' + ROUTE_PARTS.edit)
              }
            >
              <Pencil size={14} /> Edit details
            </Button>
          )}
        </div>
      </>
    );

    return () => setHeaderActions(null);
  }, [dateRangeMode, customStartedAt, customEndedAt, isCustom, configId, report, options, result]);

  return (
    <div className="m-overview-view">
      <ReportOptionsBar
        report={report}
        options={options}
        onChange={handleOptionsChange}
        canStack={canStack}
      />

      <div className="m-overview-view__body">
        <div className="m-overview-view__intro">
          <h3 className="m-overview-view__title">{title}</h3>
          <p className="m-overview-view__description">{report.description}</p>
        </div>

        <ReportSummary result={result} />

        <div className="m-overview-view__chart">
          {isError && (
            <div className="m-overview-view__placeholder">
              Could not load the data for this report.
            </div>
          )}
          {!isError && !hasData && (
            <div className="m-overview-view__placeholder">
              {isFetching ? 'Loading…' : 'No tracked time in this range for this report.'}
            </div>
          )}
          {!isError && hasData && options.chartType === ChartType.Table && (
            <ReportTable result={result} />
          )}
          {!isError && hasData && options.chartType !== ChartType.Table && (
            <Chart
              option={chartOption}
              onInstance={(instance) => (chartInstanceRef.current = instance)}
            />
          )}
          {isFetching && hasData && <div className="m-overview-view__loading">Refreshing…</div>}
        </div>
      </div>
    </div>
  );
}
