import './SwitchDatabaseModal.css';

import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import {
  settingsControllerGetSettingsQueryKey,
  settingsControllerSwitchDatabaseMutation,
} from '../../../../generated/api/@tanstack/react-query.gen';
import Button, { ButtonVariant } from '../../../../components/Button/Button';

const isElectron = typeof window.electron?.openFile === 'function';

interface SwitchDatabaseModalProps {
  onClose: () => void;
}

export function SwitchDatabaseModal({ onClose }: SwitchDatabaseModalProps) {
  const [path, setPath] = useState('');
  const queryClient = useQueryClient();

  const { mutateAsync: switchDatabase, isPending } = useMutation({
    ...settingsControllerSwitchDatabaseMutation(),
  });

  const handleBrowse = async () => {
    const selected = await window.electron!.openFile();
    if (selected) setPath(selected);
  };

  const handleSwitch = async () => {
    if (!path) return;
    try {
      await switchDatabase({ body: { path } });
      await queryClient.invalidateQueries({ queryKey: settingsControllerGetSettingsQueryKey() });
      toast('Database switched successfully', { type: 'success' });
      onClose();
    } catch (err: any) {
      toast(err?.message ?? 'Failed to switch database', { type: 'error' });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      classNames={{ modal: 'c-switch-database-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>Switch database</h3>
      <p className="text-gray-500 mt-1 mb-4" style={{ fontSize: '0.85em' }}>
        Point the application to an existing database file. The current database remains untouched.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSwitch();
        }}
      >
        <div className="flex gap-2 mb-6">
          <input
            className="c-input flex-1"
            placeholder="Path to existing .sqlite3 file"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            autoFocus
          />
          {isElectron && (
            <Button variant={ButtonVariant.Secondary} onClick={handleBrowse} type="button">
              Browse
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant={ButtonVariant.Secondary} onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant={ButtonVariant.Primary} type="submit" disabled={!path || isPending}>
            {isPending ? 'Switching…' : 'Switch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
