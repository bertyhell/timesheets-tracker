import './MoveDatabaseModal.css';

import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import {
  settingsControllerGetSettingsQueryKey,
  settingsControllerMoveDatabaseMutation,
} from '../../../../generated/api/@tanstack/react-query.gen';
import Button, { ButtonVariant } from '../../../../components/Button/Button';

const isElectron = typeof window.electron?.saveFile === 'function';

interface MoveDatabaseModalProps {
  currentPath?: string;
  onClose: () => void;
}

export function MoveDatabaseModal({ currentPath, onClose }: MoveDatabaseModalProps) {
  const [path, setPath] = useState('');
  const queryClient = useQueryClient();

  const { mutateAsync: moveDatabase, isPending } = useMutation({
    ...settingsControllerMoveDatabaseMutation(),
  });

  const handleBrowse = async () => {
    const selected = await window.electron!.saveFile(currentPath);
    if (selected) setPath(selected);
  };

  const handleMove = async () => {
    if (!path) return;
    try {
      await moveDatabase({ body: { path } });
      await queryClient.invalidateQueries({ queryKey: settingsControllerGetSettingsQueryKey() });
      toast('Database moved successfully', { type: 'success' });
      onClose();
    } catch (err: any) {
      toast(err?.message ?? 'Failed to move database', { type: 'error' });
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      classNames={{ modal: 'c-move-database-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>Move database</h3>
      <p className="text-gray-500 mt-1 mb-4" style={{ fontSize: '0.85em' }}>
        Copy the current database to a new location and switch to it.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleMove();
        }}
      >
        <div className="flex gap-2 mb-6">
          <input
            className="c-input flex-1"
            placeholder="Destination path for the database file"
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
            {isPending ? 'Moving…' : 'Move'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
