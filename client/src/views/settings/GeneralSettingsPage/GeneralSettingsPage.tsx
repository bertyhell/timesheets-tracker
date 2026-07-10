import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { settingsControllerGetSettingsOptions } from '../../../generated/api/@tanstack/react-query.gen';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { SwitchDatabaseModal } from './SwitchDatabaseModal/SwitchDatabaseModal';
import { MoveDatabaseModal } from './MoveDatabaseModal/MoveDatabaseModal';

export function GeneralSettingsPage() {
  const { data: settings } = useQuery({
    ...settingsControllerGetSettingsOptions(),
    refetchOnMount: true,
  });

  const [switchOpen, setSwitchOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

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
          <div className="flex gap-2">
            <input
              className="c-input flex-1"
              value={settings?.databasePath ?? ''}
              readOnly
              onClick={() => {
                if (!settings?.databasePath) return;
                navigator.clipboard.writeText(settings.databasePath);
                toast('Path copied to clipboard', { type: 'success' });
              }}
            />
            <Button variant={ButtonVariant.Secondary} onClick={() => setSwitchOpen(true)}>
              Open
            </Button>
            <Button variant={ButtonVariant.Secondary} onClick={() => setMoveOpen(true)}>
              Move
            </Button>
          </div>
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
