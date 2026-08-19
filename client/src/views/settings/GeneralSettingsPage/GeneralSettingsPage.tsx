import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ExternalLink, FolderOpen } from 'lucide-react';
import {
  settingsControllerGetSettingsOptions,
  settingsControllerGetDeleteEventsAfterOptions,
  settingsControllerGetDeleteEventsAfterQueryKey,
  settingsControllerPreviewDeleteEventsAfterOptions,
  settingsControllerSetDeleteEventsAfterMutation,
  settingsControllerClearDeleteEventsAfterMutation,
} from '../../../generated/api/@tanstack/react-query.gen';
import { client } from '../../../generated/api/client.gen';
import type { DeleteEventsAfterDto } from '../../../generated/api/types.gen';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { SwitchDatabaseModal } from './SwitchDatabaseModal/SwitchDatabaseModal';
import { MoveDatabaseModal } from './MoveDatabaseModal/MoveDatabaseModal';

const NEVER = 'never' as const;
type DeleteEventsAfterUnitSelection = DeleteEventsAfterDto['unit'] | typeof NEVER;

const DELETE_AFTER_UNIT_OPTIONS: { value: DeleteEventsAfterUnitSelection; label: string }[] = [
  { value: NEVER, label: 'Never' },
  { value: 'years', label: 'Years' },
  { value: 'calendarYears', label: 'Calendar years' },
  { value: 'months', label: 'Months' },
  { value: 'calendarMonths', label: 'Calendar months' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'calendarWeeks', label: 'Calendar weeks' },
  { value: 'days', label: 'Days' },
];

const isElectron = typeof window.electron?.showItemInFolder === 'function';

export function GeneralSettingsPage() {
  const { data: settings } = useQuery({
    ...settingsControllerGetSettingsOptions(),
    refetchOnMount: true,
  });

  const [switchOpen, setSwitchOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: deleteEventsAfter } = useQuery({
    ...settingsControllerGetDeleteEventsAfterOptions(),
    refetchOnMount: true,
  });

  const [numeric, setNumeric] = useState('');
  const [unit, setUnit] = useState<DeleteEventsAfterUnitSelection>(NEVER);

  useEffect(() => {
    if (deleteEventsAfter?.numeric != null) setNumeric(String(deleteEventsAfter.numeric));
    setUnit(deleteEventsAfter?.unit ?? NEVER);
  }, [deleteEventsAfter]);

  const isNever = unit === NEVER;
  const parsedNumeric = Number(numeric);
  const isValidNumeric = numeric !== '' && Number.isInteger(parsedNumeric) && parsedNumeric > 0;

  const { data: preview } = useQuery({
    ...settingsControllerPreviewDeleteEventsAfterOptions({
      query: { numeric, unit: isNever ? undefined : unit },
    }),
    enabled: !isNever && isValidNumeric,
  });

  const { mutateAsync: saveDeleteEventsAfter, isPending: isSavingCleanup } = useMutation({
    ...settingsControllerSetDeleteEventsAfterMutation(),
  });

  const { mutateAsync: clearDeleteEventsAfter, isPending: isClearingCleanup } = useMutation({
    ...settingsControllerClearDeleteEventsAfterMutation(),
  });

  const handleSaveCleanup = async () => {
    if (!isNever && !isValidNumeric) return;
    try {
      if (isNever) {
        await clearDeleteEventsAfter({});
      } else {
        await saveDeleteEventsAfter({ body: { numeric: parsedNumeric, unit } });
      }
      await queryClient.invalidateQueries({ queryKey: settingsControllerGetDeleteEventsAfterQueryKey() });
      toast('Cleanup setting saved', { type: 'success' });
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save cleanup setting', { type: 'error' });
    }
  };

  const isSavingOrClearing = isSavingCleanup || isClearingCleanup;
  const cutoffDate = !isNever && isValidNumeric ? (preview?.cutoffDate ?? null) : null;

  return (
    <div className="p-general-settings">
      <PageHeader
        title="Database"
        description="Manage the database file used by Timesheet Tracker."
      />

      <div className="px-6 mt-4 max-w-2xl">
        <section>
          <h3 className="font-semibold mb-1">Database</h3>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            Current database file used by the application.
          </p>

          <label className="block text-sm font-medium mb-1">Current path</label>
          <input
            className="c-input w-full mb-2"
            value={settings?.databasePath ?? ''}
            title={settings?.databasePath ?? ''}
            readOnly
            onClick={() => {
              if (!settings?.databasePath) return;
              navigator.clipboard.writeText(settings.databasePath);
              toast('Path copied to clipboard', { type: 'success' });
            }}
          />
          <div className="flex gap-2">
            <Button
              variant={ButtonVariant.Secondary}
              icon={<FolderOpen size={16} />}
              onClick={() => client.post({ url: '/api/settings/open-database-folder' })}
            >
              Open folder
            </Button>
            {isElectron && (
              <Button
                variant={ButtonVariant.Secondary}
                icon={<ExternalLink size={16} />}
                onClick={() => {
                  if (!settings?.databasePath) return;
                  window.electron!.showItemInFolder(settings.databasePath);
                }}
              >
                Open
              </Button>
            )}
            <Button variant={ButtonVariant.Secondary} onClick={() => setSwitchOpen(true)}>
              Switch
            </Button>
            <Button variant={ButtonVariant.Secondary} onClick={() => setMoveOpen(true)}>
              Move
            </Button>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="font-semibold mb-1">Automatic cleanup</h3>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            Automatically delete programs, websites, activity, tags and cached network requests older than a
            given age. Runs once a day and every time the app starts.
          </p>

          <div className="flex gap-2 items-center">
            <input
              className="c-input"
              style={{ width: '6rem' }}
              type="number"
              min={1}
              step={1}
              value={numeric}
              onChange={(e) => setNumeric(e.target.value)}
              placeholder="e.g. 6"
              disabled={isNever}
            />
            <select
              className="c-input"
              style={{ width: 'auto' }}
              value={unit}
              onChange={(e) => setUnit(e.target.value as DeleteEventsAfterUnitSelection)}
            >
              {DELETE_AFTER_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleSaveCleanup}
              disabled={(!isNever && !isValidNumeric) || isSavingOrClearing}
            >
              {isSavingOrClearing ? 'Saving…' : 'Save'}
            </Button>
          </div>

          <p className="text-gray-500 mt-2" style={{ fontSize: '0.85em' }}>
            {isNever
              ? 'Automatic cleanup is disabled.'
              : cutoffDate
                ? `Events started before ${new Date(cutoffDate).toLocaleString()} will be deleted.`
                : isValidNumeric
                  ? 'Computing cutoff date…'
                  : 'Enter a value to preview the cutoff date.'}
          </p>
        </section>
      </div>

      {switchOpen && <SwitchDatabaseModal onClose={() => setSwitchOpen(false)} />}
      {moveOpen && (
        <MoveDatabaseModal
          currentPath={settings?.databasePath}
          onClose={() => setMoveOpen(false)}
        />
      )}
    </div>
  );
}
