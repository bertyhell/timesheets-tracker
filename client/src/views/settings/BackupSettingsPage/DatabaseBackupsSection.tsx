import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseBackup, RotateCcw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

import type { DatabaseBackupDto } from '../../../generated/api/types.gen';

import Button, { ButtonSize, ButtonVariant } from '../../../components/Button/Button';
import {
  databaseBackupsControllerCreateMutation,
  databaseBackupsControllerFindAllOptions,
  databaseBackupsControllerFindAllQueryKey,
  databaseBackupsControllerRemoveMutation,
  databaseBackupsControllerRestoreMutation,
} from '../../../generated/api/@tanstack/react-query.gen';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function describeBackup(backup: DatabaseBackupDto): string {
  const when = new Date(backup.createdAt).toLocaleString();
  return backup.label ? `${when} (${backup.label})` : when;
}

/**
 * Snapshots of the database file, taken by hand here or by an AI assistant over MCP before it
 * changes things. Restoring only puts the tags and rules back; tracked activity is kept.
 */
export function DatabaseBackupsSection() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');

  const { data: backups = [], isLoading } = useQuery(databaseBackupsControllerFindAllOptions());
  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: databaseBackupsControllerFindAllQueryKey() });

  const { mutateAsync: createBackup, isPending: isCreating } = useMutation(
    databaseBackupsControllerCreateMutation()
  );
  const { mutateAsync: restoreBackup, isPending: isRestoring } = useMutation(
    databaseBackupsControllerRestoreMutation()
  );
  const { mutateAsync: removeBackup, isPending: isRemoving } = useMutation(
    databaseBackupsControllerRemoveMutation()
  );
  const isBusy = isCreating || isRestoring || isRemoving;

  const handleCreate = async () => {
    try {
      const backup = await createBackup({ body: { label: label.trim() || undefined } });
      setLabel('');
      toast(`Backup created: ${backup.filePath}`, { type: 'success' });
    } catch (err: any) {
      toast(err?.message ?? 'Could not create a backup', { type: 'error' });
    } finally {
      await refreshList();
    }
  };

  const handleRestore = async (backup: DatabaseBackupDto) => {
    const confirmed = window.confirm(
      `Restore tags, tag names, auto tags and auto notes from the backup of ${describeBackup(backup)}?\n\n` +
        'Tracked activity is kept. A backup of the current state is made first, so this can be undone.'
    );
    if (!confirmed) return;
    try {
      const result = await restoreBackup({ path: { id: backup.id } });
      // Tags and rules feed almost every screen, so drop all cached data.
      await queryClient.invalidateQueries();
      toast(`Restored. The previous state was saved as ${result.safetyBackup.id}`, {
        type: 'success',
      });
    } catch (err: any) {
      toast(err?.message ?? 'Could not restore that backup', { type: 'error' });
    }
  };

  const handleRemove = async (backup: DatabaseBackupDto) => {
    if (!window.confirm(`Delete the backup of ${describeBackup(backup)}? This cannot be undone.`)) {
      return;
    }
    try {
      await removeBackup({ path: { id: backup.id } });
    } catch (err: any) {
      toast(err?.message ?? 'Could not delete that backup', { type: 'error' });
    } finally {
      await refreshList();
    }
  };

  return (
    <section className="mt-8">
      <h3 className="font-semibold mb-1">Database backups</h3>
      <p className="text-gray-500 mb-3" style={{ fontSize: '0.9em' }}>
        A backup is a full copy of the database, stored in a folder next to it. Restoring one puts
        your tag names, tags, auto tags and auto notes back to how they were; tracked activity
        recorded since then is kept. AI assistants connected over MCP are asked to make one before
        they change anything.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className="c-input flex-1"
          placeholder="Label (optional)"
          value={label}
          maxLength={100}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Button
          variant={ButtonVariant.Primary}
          icon={<DatabaseBackup size={16} />}
          onClick={handleCreate}
          disabled={isBusy}
        >
          {isCreating ? 'Backing up…' : 'Create backup'}
        </Button>
      </div>

      {isLoading ? null : backups.length === 0 ? (
        <p className="text-gray-500" style={{ fontSize: '0.9em' }}>
          No backups yet.
        </p>
      ) : (
        <table className="c-table w-full">
          <thead>
            <tr className="h-10 bg-white">
              <th className="text-left pl-3">Created</th>
              <th className="text-left pl-3">Label</th>
              <th className="text-left pl-3">Size</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {backups.map((backup) => (
              <tr key={backup.id} title={backup.filePath}>
                <td className="pl-3">{new Date(backup.createdAt).toLocaleString()}</td>
                <td className="pl-3">{backup.label ?? ''}</td>
                <td className="pl-3">{formatSize(backup.sizeBytes)}</td>
                <td className="pr-3">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant={ButtonVariant.Secondary}
                      size={ButtonSize.Small}
                      icon={<RotateCcw size={14} />}
                      onClick={() => handleRestore(backup)}
                      disabled={isBusy}
                    >
                      Restore
                    </Button>
                    <Button
                      variant={ButtonVariant.Secondary}
                      size={ButtonSize.Small}
                      icon={<Trash2 size={14} />}
                      onClick={() => handleRemove(backup)}
                      disabled={isBusy}
                      title="Delete backup"
                      ariaLabel="Delete backup"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
