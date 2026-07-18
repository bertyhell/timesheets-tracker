import './OverviewView.css';
import 'react-pivottable/pivottable.css';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import TableRenderers from 'react-pivottable/TableRenderers';
import createPlotlyRenderers from 'react-pivottable/PlotlyRenderers';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import { toast } from 'react-toastify';
import { Download, Pencil, Save, Copy } from 'lucide-react';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { DateRangeSelect } from '../../../components/DateRangeSelect/DateRangeSelect';
import { Dropdown } from '../../../components/Dropdown/Dropdown';
import { ROUTE_PARTS } from '../../../App';
import { headerActionsAtom } from '../../../store/store';
import { DateRangeMode, OverviewSourceType } from '../../../types/types';
import { overviewsApi } from '../../../api/overviews';
import { PREDEFINED_OVERVIEW_CONFIGS } from '../predefined-configs';
import { SOURCE_TYPE_OPTIONS } from '../source-type-options';
import { resolveDateRange } from '../helpers/resolveDateRange';
import { pivotToCsv, downloadCsv } from '../helpers/pivotToCsv';

const PlotlyComponent = createPlotlyComponent(Plotly as any);
const PlotlyRenderers = createPlotlyRenderers(PlotlyComponent);
const allRenderers = { ...TableRenderers, ...PlotlyRenderers };

export function OverviewView() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const setHeaderActions = useSetAtom(headerActionsAtom);

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
  const [sourceTypes, setSourceTypes] = useState<OverviewSourceType[]>([]);
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
    setSourceTypes(resolvedConfig.sourceTypes);
    setPivotState(resolvedConfig.pivotState);
  }, [resolvedConfig]);

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

  const toggleSourceType = (value: OverviewSourceType) => {
    setSourceTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const handleExport = () => {
    if (!flatRows || !resolvedConfig) return;
    const csv = pivotToCsv(flatRows, pivotState);
    const filename = 'label' in resolvedConfig ? resolvedConfig.label : resolvedConfig.name;
    downloadCsv(csv, filename);
  };

  const handleSave = async () => {
    if (!configId || !isCustom) return;
    await overviewsApi.update(configId, {
      pivotState,
      dateRangeMode,
      customStartedAt,
      customEndedAt,
      sourceTypes,
    });
    toast('Overview saved', { type: 'success' });
  };

  const handleSaveAsNew = () => {
    navigate('/' + ROUTE_PARTS.overviews + '/' + ROUTE_PARTS.new, {
      state: { sourceTypes, pivotState, dateRangeMode, customStartedAt, customEndedAt },
    });
  };

  // Publish the view's controls into the shared top bar (owned by OverviewsPage)
  useEffect(() => {
    if (!resolvedConfig) {
      setHeaderActions(null);
      return;
    }

    const sourceLabel =
      sourceTypes.length === 0
        ? 'Select sources'
        : SOURCE_TYPE_OPTIONS.filter((option) => sourceTypes.includes(option.value))
            .map((option) => option.label)
            .join(', ');

    setHeaderActions(
      <>
        <div className="m-overview-view__filters">
          <span className="m-overview-view__filters-label">Filters</span>
          <Dropdown label={sourceLabel} className="m-overview-view__source-dropdown">
            {() => (
              <div className="m-overview-view__source-options">
                {SOURCE_TYPE_OPTIONS.map((option) => (
                  <label key={option.value} className="m-overview-view__source-option">
                    <input
                      type="checkbox"
                      checked={sourceTypes.includes(option.value)}
                      onChange={() => toggleSourceType(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </Dropdown>

          <DateRangeSelect
            mode={dateRangeMode}
            customStartedAt={customStartedAt}
            customEndedAt={customEndedAt}
            onChange={handleDateRangeChange}
          />
        </div>

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
      </>
    );

    return () => setHeaderActions(null);
  }, [resolvedConfig, sourceTypes, dateRangeMode, customStartedAt, customEndedAt, pivotState, isCustom, configId, flatRows]);

  if (!resolvedConfig) {
    return null;
  }

  return (
    <div className="m-overview-view">
      <div className="m-overview-view__table">
        <div className="m-overview-view__table-header">
          <span className="m-overview-view__table-header-label">Group &amp; display</span>
          <span className="m-overview-view__table-header-hint">
            Drag fields below to change how the loaded data is grouped, sorted, and charted.
          </span>
        </div>
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
