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
import { SOURCE_TYPE_OPTIONS } from '../../views/OverviewsPage/source-type-options';

const BLANK_PIVOT_STATE = {
  rows: [],
  cols: [],
  vals: [],
  aggregatorName: 'Count',
  rendererName: 'Table',
  valueFilter: {},
  sorters: {},
  derivedAttributes: {},
};

interface ForkState {
  sourceTypes?: OverviewSourceType[];
  pivotState?: Record<string, any>;
  dateRangeMode?: DateRangeMode;
  customStartedAt?: string;
  customEndedAt?: string;
}

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
  const [sourceTypes, setSourceTypes] = useState<OverviewSourceType[]>(
    forkState?.sourceTypes ?? [OverviewSourceType.Tag]
  );
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(
    forkState?.dateRangeMode ?? DateRangeMode.ThisWeek
  );
  const [customStartedAt, setCustomStartedAt] = useState<string | undefined>(forkState?.customStartedAt);
  const [customEndedAt, setCustomEndedAt] = useState<string | undefined>(forkState?.customEndedAt);

  useEffect(() => {
    if (existingConfig) {
      setName(existingConfig.name);
      setSourceTypes(existingConfig.sourceTypes);
      setDateRangeMode(existingConfig.dateRangeMode);
      setCustomStartedAt(existingConfig.customStartedAt ?? undefined);
      setCustomEndedAt(existingConfig.customEndedAt ?? undefined);
    }
  }, [existingConfig]);

  const handleClose = () => {
    navigate('/' + ROUTE_PARTS.overviews);
  };

  const toggleSourceType = (value: OverviewSourceType) => {
    setSourceTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSave = async () => {
    if (id) {
      const updated = await overviewsApi.update(id, {
        name,
        sourceTypes,
        dateRangeMode,
        customStartedAt,
        customEndedAt,
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
        pivotState: forkState?.pivotState ?? BLANK_PIVOT_STATE,
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

      <h4 className="mt-4">Data sources</h4>
      <div className="c-overview-source-types">
        {SOURCE_TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="c-overview-source-types__option">
            <input
              type="checkbox"
              checked={sourceTypes.includes(option.value)}
              onChange={() => toggleSourceType(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

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
          <Button disabled={!name || sourceTypes.length === 0} onClick={handleSave} variant={ButtonVariant.Primary}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
