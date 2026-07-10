import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  settingsControllerGetSettingsOptions,
  settingsControllerMoveDatabaseMutation,
  settingsControllerSwitchDatabaseMutation,
} from '../../../generated/api/@tanstack/react-query.gen';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { toast } from 'react-toastify';

const isElectron = typeof window.electron?.openFile === 'function';

export function GeneralSettingsPage() {
  const { data: settings } = useQuery({
    ...settingsControllerGetSettingsOptions(),
    refetchOnMount: true,
  });

  const [switchPath, setSwitchPath] = useState('');
  const [movePath, setMovePath] = useState('');

  const { mutateAsync: switchDatabase, isPending: isSwitching } = useMutation({
    ...settingsControllerSwitchDatabaseMutation(),
  });

  const { mutateAsync: moveDatabase, isPending: isMoving } = useMutation({
    ...settingsControllerMoveDatabaseMutation(),
  });

  const handleBrowseSwitch = async () => {
    const selected = await window.electron!.openFile();
    if (selected) setSwitchPath(selected);
  };

  const handleBrowseMove = async () => {
    const defaultPath = settings?.databasePath;
    const selected = await window.electron!.saveFile(defaultPath);
    if (selected) setMovePath(selected);
  };

  const handleSwitch = async () => {
    if (!switchPath) return;
    try {
      await switchDatabase({ body: { path: switchPath } });
      toast('Database switched successfully', { type: 'success' });
      setSwitchPath('');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to switch database', { type: 'error' });
    }
  };

  const handleMove = async () => {
    if (!movePath) return;
    try {
      await moveDatabase({ body: { path: movePath } });
      toast('Database moved successfully', { type: 'success' });
      setMovePath('');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to move database', { type: 'error' });
    }
  };

  return (
    <div className="p-general-settings">
      <PageHeader
        title="General"
        description="General application settings."
      />

      <div className="px-4 mt-4 max-w-2xl">
        <section>
          <h3 className="font-semibold mb-1">Database</h3>
          <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
            Current database file used by the application.
          </p>

          <label className="block text-sm font-medium mb-1">Current path</label>
          <input
            className="c-input w-full mb-6"
            value={settings?.databasePath ?? ''}
            readOnly
          />

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Switch database</label>
            <p className="text-gray-500 mb-2" style={{ fontSize: '0.85em' }}>
              Point the application to an existing database file. The current database remains
              untouched.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                className="c-input flex-1"
                placeholder="Path to existing .sqlite3 file"
                value={switchPath}
                onChange={(e) => setSwitchPath(e.target.value)}
              />
              {isElectron && (
                <Button variant={ButtonVariant.Secondary} onClick={handleBrowseSwitch}>
                  Browse
                </Button>
              )}
            </div>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleSwitch}
              disabled={!switchPath || isSwitching}
            >
              {isSwitching ? 'Switching…' : 'Switch'}
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Move database</label>
            <p className="text-gray-500 mb-2" style={{ fontSize: '0.85em' }}>
              Copy the current database to a new location and switch to it.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                className="c-input flex-1"
                placeholder="Destination path for the database file"
                value={movePath}
                onChange={(e) => setMovePath(e.target.value)}
              />
              {isElectron && (
                <Button variant={ButtonVariant.Secondary} onClick={handleBrowseMove}>
                  Browse
                </Button>
              )}
            </div>
            <Button
              variant={ButtonVariant.Primary}
              onClick={handleMove}
              disabled={!movePath || isMoving}
            >
              {isMoving ? 'Moving…' : 'Move'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
