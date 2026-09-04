import './EditOverviewConfigModal.css';
import React, { type ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Button, { ButtonVariant } from '../Button/Button';
import { DateRangeSelect } from '../DateRangeSelect/DateRangeSelect';
import { ROUTE_PARTS } from '../../App';
import { DateRangeMode, OverviewSourceType } from '../../types/types';
import { overviewsApi } from '../../api/overviews';
import { DEFAULT_REPORT_ID, findReport, REPORTS } from '../../views/OverviewsPage/reports/report-catalog';
import { resolveReportOptions, toReportState } from '../../views/OverviewsPage/reports/helpers/report-state';
import type { ReportState } from '../../views/OverviewsPage/reports/report.types';

/** State handed over by "Save as new", so the saved overview keeps the tweaks made in the view. */
interface ForkState {
  sourceTypes?: OverviewSourceType[];
  reportState?: ReportState;
  dateRangeMode?: DateRangeMode;
  customStartedAt?: string;
  customEndedAt?: string;
}

const DEFAULT_REPORT = findReport(DEFAULT_REPORT_ID) ?? REPORTS[0];

export function EditOverviewConfigModal() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const forkState = (location.state as ForkState | null) ?? null;

  const { data: existingConfig } = useQuery({
    queryKey: ['overview', id],
    queryFn: () => overviewsApi.findOne(id as string),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [reportId, setReportId] = useState<string>(
    forkState?.reportState?.reportId ?? DEFAULT_REPORT_ID
  );
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(
    forkState?.dateRangeMode ?? DEFAULT_REPORT.defaultDateRangeMode
  );
  const [customStartedAt, setCustomStartedAt] = useState<string | undefined>(forkState?.customStartedAt);
  const [customEndedAt, setCustomEndedAt] = useState<string | undefined>(forkState?.customEndedAt);

  useEffect(() => {
    if (existingConfig) {
      setName(existingConfig.name);
      setReportId(existingConfig.reportState?.reportId ?? DEFAULT_REPORT_ID);
      setDateRangeMode(existingConfig.dateRangeMode);
      setCustomStartedAt(existingConfig.customStartedAt ?? undefined);
      setCustomEndedAt(existingConfig.customEndedAt ?? undefined);
    }
  }, [existingConfig]);

  const report = findReport(reportId) ?? DEFAULT_REPORT;
  // A fork keeps the options it was saved with; picking another report starts from its defaults.
  const options =
    forkState?.reportState?.reportId === report.id
      ? resolveReportOptions(report, forkState?.reportState?.options)
      : resolveReportOptions(report, existingConfig?.reportState?.options);
  const sourceTypes = report.sourceTypes(options);

  const handleClose = () => {
    navigate('/' + ROUTE_PARTS.overviews);
  };

  const handleSave = async () => {
    if (id) {
      const updated = await overviewsApi.update(id, {
        name,
        sourceTypes,
        dateRangeMode,
        customStartedAt,
        customEndedAt,
        reportState: toReportState(report, options),
      });
      toast('Overview updated', { type: 'success' });
      navigate('/' + ROUTE_PARTS.overviews + '/' + updated.id);
    } else {
      const created = await overviewsApi.create({
        name,
        sourceTypes,
        dateRangeMode,
        customStartedAt,
        customEndedAt,
        reportState: toReportState(report, options),
      });
      toast('Overview created', { type: 'success' });
      navigate('/' + ROUTE_PARTS.overviews + '/' + created.id);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await overviewsApi.remove(id);
    toast('Overview deleted', { type: 'success' });
    handleClose();
  };

  return (
    <Modal
      open={true}
      onClose={handleClose}
      classNames={{ modal: 'c-edit-overview-config-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Edit overview details' : 'New custom overview'}</h3>

      <h4 className="mt-4">Name</h4>
      <div className="c-form">
        <input
          className="c-input"
          value={name}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => setName(evt.target?.value)}
        />
      </div>

      <h4 className="mt-4">Report</h4>
      <div className="c-form">
        <select
          className="c-input"
          value={reportId}
          onChange={(evt: ChangeEvent<HTMLSelectElement>) => setReportId(evt.target.value)}
        >
          {REPORTS.map((reportOption) => (
            <option key={reportOption.id} value={reportOption.id}>
              {reportOption.group} · {reportOption.label}
            </option>
          ))}
        </select>
      </div>
      <p className="c-edit-overview-config-modal__hint">{report.description}</p>

      <h4 className="mt-4">Default date range</h4>
      <DateRangeSelect
        mode={dateRangeMode}
        customStartedAt={customStartedAt}
        customEndedAt={customEndedAt}
        onChange={(mode, start, end) => {
          setDateRangeMode(mode);
          setCustomStartedAt(start);
          setCustomEndedAt(end);
        }}
      />

      <div className="flex flex-row justify-between gap-2 mt-48">
        <div>
          {id && (
            <Button onClick={handleDelete} className="!bg-red-100 !text-red-700 hover:!bg-red-200">
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button disabled={!name} onClick={handleSave} variant={ButtonVariant.Primary}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
