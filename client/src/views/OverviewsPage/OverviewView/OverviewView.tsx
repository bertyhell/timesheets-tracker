import './OverviewView.css';
import 'react-pivottable/pivottable.css';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import TableRenderers from 'react-pivottable/TableRenderers';
import createPlotlyRenderers from 'react-pivottable/PlotlyRenderers';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import { toast } from 'react-toastify';
import { Download, Pencil, Save, Copy } from 'lucide-react';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { DateRangeSelect } from '../../../components/DateRangeSelect/DateRangeSelect';
import { ROUTE_PARTS } from '../../../App';
import { DateRangeMode, OverviewSourceType } from '../../../types/types';
import { overviewsApi } from '../../../api/overviews';
import { PREDEFINED_OVERVIEW_CONFIGS } from '../predefined-configs';
import { resolveDateRange } from '../helpers/resolveDateRange';
import { pivotToCsv, downloadCsv } from '../helpers/pivotToCsv';

const PlotlyComponent = createPlotlyComponent(Plotly as any);
const PlotlyRenderers = createPlotlyRenderers(PlotlyComponent);
const allRenderers = { ...TableRenderers, ...PlotlyRenderers };

export function OverviewView() {
  const { configId } = useParams();
  const navigate = useNavigate();

  const predefined = useMemo(
    () => PREDEFINED_OVERVIEW_CONFIGS.find((c) => c.id === configId),
    [configId]
  );
  const isCustom = !predefined;

  const { data: customConfig } = useQuery({
    queryKey: ['overview', configId],
    queryFn: () => overviewsApi.findOne(configId as string),
    enabled: isCustom && !!configId,
  });

  const resolvedConfig = predefined ?? customConfig;

  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(DateRangeMode.ThisWeek);
  const [customStartedAt, setCustomStartedAt] = useState<string | undefined>();
  const [customEndedAt, setCustomEndedAt] = useState<string | undefined>();
  const [pivotState, setPivotState] = useState<Record<string, any>>({
    rows: [],
    cols: [],
    vals: [],
    aggregatorName: 'Count',
    rendererName: 'Table',
    valueFilter: {},
    sorters: {},
    derivedAttributes: {},
  });

  // Reset local view state whenever the resolved config changes (switching between overviews)
  useEffect(() => {
    if (!resolvedConfig) return;
    setDateRangeMode(resolvedConfig.dateRangeMode);
    setCustomStartedAt(('customStartedAt' in resolvedConfig && resolvedConfig.customStartedAt) || undefined);
    setCustomEndedAt(('customEndedAt' in resolvedConfig && resolvedConfig.customEndedAt) || undefined);
    setPivotState(resolvedConfig.pivotState);
  }, [resolvedConfig]);

  const sourceTypes: OverviewSourceType[] = resolvedConfig?.sourceTypes ?? [];
  const { startedAt, endedAt } = resolveDateRange(dateRangeMode, customStartedAt, customEndedAt);

  const { data: flatRows } = useQuery({
    queryKey: ['overview-data', startedAt, endedAt, sourceTypes],
    queryFn: () => overviewsApi.getData(startedAt, endedAt, sourceTypes),
    enabled: sourceTypes.length > 0,
  });

  const handleDateRangeChange = (mode: DateRangeMode, newStart?: string, newEnd?: string) => {
    setDateRangeMode(mode);
    setCustomStartedAt(newStart);
    setCustomEndedAt(newEnd);
  };

  const handleExport = () => {
    if (!flatRows || !resolvedConfig) return;
    const csv = pivotToCsv(flatRows, pivotState);
    const filename = 'label' in resolvedConfig ? resolvedConfig.label : resolvedConfig.name;
    downloadCsv(csv, filename);
  };

  const handleSave = async () => {
    if (!configId || !isCustom) return;
    await overviewsApi.update(configId, { pivotState, dateRangeMode, customStartedAt, customEndedAt });
    toast('Overview saved', { type: 'success' });
  };

  const handleSaveAsNew = () => {
    navigate('/' + ROUTE_PARTS.overviews + '/' + ROUTE_PARTS.new, {
      state: { sourceTypes, pivotState, dateRangeMode, customStartedAt, customEndedAt },
    });
  };

  if (!resolvedConfig) {
    return null;
  }

  const label = 'label' in resolvedConfig ? resolvedConfig.label : resolvedConfig.name;

  return (
    <div className="m-overview-view">
      <div className="m-overview-view__header">
        <h2 className="m-overview-view__title">{label}</h2>
        <div className="m-overview-view__controls">
          <DateRangeSelect
            mode={dateRangeMode}
            customStartedAt={customStartedAt}
            customEndedAt={customEndedAt}
            onChange={handleDateRangeChange}
          />
          <div className="m-overview-view__actions">
            <Button variant={ButtonVariant.Secondary} onClick={handleExport}>
              <Download size={14} /> Export CSV
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
        </div>
      </div>

      <div className="m-overview-view__table">
        <PivotTableUI
          data={(flatRows ?? []) as unknown as Array<{ [key: string]: string }>}
          {...pivotState}
          renderers={allRenderers}
          onChange={(state: Record<string, any>) => setPivotState(state)}
          plotlyOptions={{ width: null }}
        />
      </div>
    </div>
  );
}
